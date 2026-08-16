#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Safe Upstream Sync Tool for Coptic Dictionary
Synchronizes raw linguistic data (databases, etymology tables, inflections)
from https://github.com/KELLIA/dictionary into an isolated staging branch
without affecting modern React/Vite/Cloudflare application files.
"""

import os
import sys
import json
import argparse
import subprocess
import urllib.request
import sqlite3
from datetime import datetime

# Windows stdout utf-8 compatibility
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

UPSTREAM_REPO_URL = "https://github.com/KELLIA/dictionary.git"
UPSTREAM_API_URL = "https://api.github.com/repos/KELLIA/dictionary"
METADATA_FILE = ".upstream_sync.json"

DATA_PATTERNS = [
    "alpha_*.db",
    "utils/egyptian_etymologies.tab",
    "utils/inflections.tab",
    "utils/lemmas.tab",
    "utils/collocates.tab",
    "utils/corpus_examples.tab"
]

def load_sync_metadata(base_dir: str) -> dict:
    meta_path = os.path.join(base_dir, METADATA_FILE)
    if os.path.exists(meta_path):
        try:
            with open(meta_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "upstream_repo": UPSTREAM_REPO_URL,
        "last_synced_commit": None,
        "last_synced_date": None,
        "synced_db_file": "alpha_kyima_rc1.db",
        "total_entries": 11272
    }

def save_sync_metadata(base_dir: str, meta: dict):
    meta_path = os.path.join(base_dir, METADATA_FILE)
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    print(f"Updated sync metadata at {METADATA_FILE}")

def get_latest_upstream_commit():
    """Queries GitHub API for the latest commit on KELLIA/dictionary master branch."""
    url = f"{UPSTREAM_API_URL}/commits/master"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Coptic-Dictionary-Sync-Tool/2.0",
        "Accept": "application/vnd.github.v3+json"
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return {
                "sha": data.get("sha"),
                "date": data.get("commit", {}).get("author", {}).get("date"),
                "message": data.get("commit", {}).get("message", "").strip().split("\n")[0],
                "author": data.get("commit", {}).get("author", {}).get("name")
            }
    except Exception as e:
        print(f"Note: GitHub API request failed ({e}), falling back to git remote check.")
        return None

def check_upstream_remote():
    """Checks if git remote 'upstream' is configured, otherwise adds it."""
    try:
        out = subprocess.check_output(["git", "remote", "-v"], stderr=subprocess.DEVNULL).decode("utf-8")
        if "upstream" not in out:
            print(f"Configuring git remote 'upstream' -> {UPSTREAM_REPO_URL}")
            subprocess.check_call(["git", "remote", "add", "upstream", UPSTREAM_REPO_URL])
        return True
    except Exception as e:
        print(f"Git remote configuration notice: {e}")
        return False

def check_updates(base_dir: str):
    """Compares upstream state with local metadata."""
    meta = load_sync_metadata(base_dir)
    last_sha = meta.get("last_synced_commit")
    
    print("=" * 70)
    print(" COPTIC DICTIONARY ONLINE - UPSTREAM SYNC CHECK")
    print(f" Target: {UPSTREAM_REPO_URL}")
    print(f" Current Local Sync Commit: {last_sha or 'Initial Baseline'}")
    print(f" Last Sync Date: {meta.get('last_synced_date') or 'Never'}")
    print("=" * 70)

    remote_info = get_latest_upstream_commit()
    if remote_info:
        latest_sha = remote_info["sha"]
        print(f"Latest Upstream Commit : {latest_sha[:8]} by {remote_info['author']} ({remote_info['date']})")
        print(f"Commit Message         : {remote_info['message']}")
        
        if last_sha and (last_sha == latest_sha or last_sha.startswith(latest_sha) or latest_sha.startswith(last_sha)):
            print("\n✅ Upstream data is ALREADY UP TO DATE. No new data changes.")
            return False
        else:
            print(f"\n✨ NEW DATA DETECTED in upstream repository!")
            print(f"   Run 'npm run upstream:sync' to safely ingest on a new branch.")
            return True
    else:
        print("Could not retrieve remote commit metadata. Please check internet connection.")
        return False

def sync_data(base_dir: str, branch_name: str = "upstream-sync", dry_run: bool = False):
    """Safely extracts raw data from upstream into a separate stability branch."""
    meta = load_sync_metadata(base_dir)
    print("=" * 70)
    print(f" STARTING SAFE UPSTREAM SYNC (Branch: {branch_name})")
    print("=" * 70)

    check_upstream_remote()

    if dry_run:
        print(f"[DRY-RUN] Would fetch upstream and checkout only data files on branch '{branch_name}'.")
        return

    # 1. Fetch upstream
    print("\n[Step 1/5] Fetching upstream commits from KELLIA/dictionary...")
    try:
        subprocess.check_call(["git", "fetch", "upstream", "master"])
    except subprocess.CalledProcessError as e:
        print(f"Error fetching from upstream git: {e}")
        sys.exit(1)

    # 2. Get upstream commit SHA
    latest_sha = subprocess.check_output(["git", "rev-parse", "upstream/master"]).decode("utf-8").strip()
    print(f"Fetched upstream commit: {latest_sha[:10]}")

    # 3. Create or switch to stability branch
    print(f"\n[Step 2/5] Switching to isolated sync branch '{branch_name}'...")
    try:
        # Check if branch exists
        branches = subprocess.check_output(["git", "branch"]).decode("utf-8")
        if branch_name in branches:
            subprocess.check_call(["git", "checkout", branch_name])
        else:
            subprocess.check_call(["git", "checkout", "-b", branch_name])
    except Exception as e:
        print(f"Branch switch notice: {e}")

    # 4. Check out ONLY raw data files from upstream
    print("\n[Step 3/5] Extracting only raw linguistic data (zero code overwrites)...")
    data_files = [
        "utils/egyptian_etymologies.tab",
        "utils/inflections.tab",
        "utils/lemmas.tab",
        "utils/collocates.tab"
    ]

    for f in data_files:
        try:
            subprocess.check_call(["git", "checkout", "upstream/master", "--", f], stderr=subprocess.DEVNULL)
            print(f"  ✓ Updated {f}")
        except Exception:
            pass

    # Try checking out latest db if available
    try:
        db_files = subprocess.check_output(["git", "ls-tree", "--name-only", "upstream/master"]).decode("utf-8").split("\n")
        for line in db_files:
            if line.startswith("alpha_") and line.endswith(".db"):
                subprocess.check_call(["git", "checkout", "upstream/master", "--", line], stderr=subprocess.DEVNULL)
                print(f"  ✓ Updated database: {line}")
                meta["synced_db_file"] = line
    except Exception as e:
        print(f"Database extraction notice: {e}")

    # 5. Run modern D1 database builder
    print("\n[Step 4/5] Running modern D1 enrichment pipeline (FTS5 + Phonetics + Paradigms)...")
    from build_d1_database import build_d1_database
    build_d1_database(base_dir)

    print("\n[Step 5/5] Generating clean Cloudflare D1 SQL dump...")
    from export_sql_dump import generate_d1_export
    generate_d1_export()

    # Update metadata
    meta["last_synced_commit"] = latest_sha
    meta["last_synced_date"] = datetime.utcnow().isoformat() + "Z"
    save_sync_metadata(base_dir, meta)

    print("\n" + "=" * 70)
    print(f"🎉 UPSTREAM SYNC COMPLETE ON BRANCH '{branch_name}'!")
    print("=" * 70)
    print("Next steps:")
    print(f" 1. Test your local database: npm run dev")
    print(f" 2. Deploy to Cloudflare D1:  npm run data:deploy")
    print(f" 3. Merge branch when ready: git checkout main && git merge {branch_name}")

def main():
    parser = argparse.ArgumentParser(description="Safely sync raw linguistic data from KELLIA/dictionary")
    parser.add_argument("--check", action="store_true", help="Check for upstream data changes without modifying files")
    parser.add_argument("--sync", action="store_true", help="Fetch data changes onto an isolated branch and rebuild database")
    parser.add_argument("--branch", default="upstream-sync", help="Target git branch for sync (default: upstream-sync)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate sync without file writes")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    if args.check:
        check_updates(base_dir)
    elif args.sync or not sys.argv[1:]:
        sync_data(base_dir, branch_name=args.branch, dry_run=args.dry_run)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()

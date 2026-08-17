import urllib.request
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

raw_dir = 'd:/Copto/dictionary/data/corpora_raw/patristic_tt'
os.makedirs(raw_dir, exist_ok=True)

repos_to_fetch = [
    ('AP', 'apophthegmata.patrum_TT'),
    ('shenoute-fox', 'shenoute.fox_TT'),
    ('shenoute-a22', 'shenoute.a22_TT'),
    ('shenoute-eagerness', 'shenoute.eagerness_TT'),
    ('shenoute-night', 'shenoute.night_TT'),
    ('shenoute-true', 'shenoute.true_TT'),
    ('besa-letters', 'besa.letters_TT'),
    ('martyrdom-victor', 'martyrdom.victor_TT'),
    ('dormition-john', 'dormition.john_TT'),
    ('life-aphou', 'life.aphou_TT'),
    ('life-onnophrius', 'life.onnophrius_TT'),
    ('life-paul-tamma', 'life.paul.tamma_TT'),
    ('pistis-sophia', 'pistis.sophia_TT'),
    ('pseudo-chrysostom', 'pseudo.chrysostom_TT'),
    ('pseudo-athanasius-discourses', 'pseudo.athanasius.discourses_TT')
]

for repo, tt_dir in repos_to_fetch:
    url = f"https://api.github.com/repos/CopticScriptorium/corpora/contents/{repo}/{tt_dir}"
    req = urllib.request.Request(url, headers={'User-Agent': 'CoptoLex/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            files = json.loads(resp.read().decode('utf-8'))
            print(f"Fetching {repo} ({len(files)} files)...")
            for f in files:
                fname = f['name']
                furl = f['download_url']
                local_path = os.path.join(raw_dir, f"{repo}_{fname}")
                if not os.path.exists(local_path):
                    urllib.request.urlretrieve(furl, local_path)
    except Exception as e:
        print(f"Error {repo}: {e}")

print("Downloaded all patristic files!")
print("Total patristic files:", len(os.listdir(raw_dir)))

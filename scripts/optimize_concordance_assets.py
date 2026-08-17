import json
import os
import shutil

os.makedirs('d:/Copto/dictionary/public/data', exist_ok=True)

# Copy full master concordance to public directory for static CDN/Worker serving
src_file = 'd:/Copto/dictionary/data/corpus_concordance.json'
dst_file = 'd:/Copto/dictionary/public/data/corpus_concordance.json'
shutil.copyfile(src_file, dst_file)
print(f"Copied master concordance ({os.path.getsize(dst_file)} bytes) to public/data/")

# Create a lightweight core subset for instant synchronous bundling (top 400 most common words)
with open(src_file, 'r', encoding='utf-8') as f:
    full_data = json.load(f)

# Sort by number of citations or keep top 400 keys
core_subset = {}
for i, (k, v) in enumerate(full_data.items()):
    if i < 350 or len(v) >= 3:
        core_subset[k] = v[:3] # keep top 3 for preview

core_path = 'd:/Copto/dictionary/data/core_concordance.json'
with open(core_path, 'w', encoding='utf-8') as f:
    json.dump(core_subset, f, ensure_ascii=False)

print(f"Created core concordance bundle ({os.path.getsize(core_path)} bytes) for instant bundle inclusion.")

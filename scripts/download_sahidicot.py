import urllib.request
import zipfile
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

os.makedirs('d:/Copto/dictionary/data/corpora_raw', exist_ok=True)
zip_path = 'd:/Copto/dictionary/data/corpora_raw/sahidic.ot_TT.zip'

url = "https://raw.githubusercontent.com/CopticScriptorium/corpora/master/sahidic.ot/sahidic.ot_TT.zip"
print(f"Downloading {url}...")
urllib.request.urlretrieve(url, zip_path)
print(f"Downloaded OT! Size: {os.path.getsize(zip_path)} bytes")

with zipfile.ZipFile(zip_path, 'r') as z:
    file_list = z.namelist()
    print(f"Total files in sahidic.ot_TT.zip: {len(file_list)}")
    print(f"Sample files: {file_list[:15]}")

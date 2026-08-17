import urllib.request
import zipfile
import io
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

os.makedirs('d:/Copto/dictionary/data/corpora_raw', exist_ok=True)
zip_path = 'd:/Copto/dictionary/data/corpora_raw/sahidica.nt_TT.zip'

url = "https://raw.githubusercontent.com/CopticScriptorium/corpora/master/sahidica.nt/sahidica.nt_TT.zip"
print(f"Downloading {url}...")
urllib.request.urlretrieve(url, zip_path)
print(f"Downloaded! Size: {os.path.getsize(zip_path)} bytes")

with zipfile.ZipFile(zip_path, 'r') as z:
    file_list = z.namelist()
    print(f"Total files in sahidica.nt_TT.zip: {len(file_list)}")
    print(f"Sample files: {file_list[:15]}")

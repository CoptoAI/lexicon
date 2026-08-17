import urllib.request
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

os.makedirs('d:/Copto/dictionary/data/corpora_raw/bibles', exist_ok=True)

urls = {
    'en_kjv.json': 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json',
    'ar_svd.json': 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ar_svd.json'
}

for fname, url in urls.items():
    dest = os.path.join('d:/Copto/dictionary/data/corpora_raw/bibles', fname)
    if not os.path.exists(dest):
        print(f"Downloading {fname} from {url}...")
        urllib.request.urlretrieve(url, dest)
        print(f"Downloaded {fname}: {os.path.getsize(dest)} bytes")
    else:
        print(f"Already exists: {fname}")

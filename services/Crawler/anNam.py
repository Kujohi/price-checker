import requests
import json
from bs4 import BeautifulSoup

def crawl(url: str) -> str:
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    return soup.prettify()

if __name__ == "__main__":
    url = 'https://shop.annam-gourmet.com/hcm-est/vi/catalogsearch/result/?q=s%E1%BB%AFa+chua'
    content = crawl(url)
    with open('anNam.html', 'w', encoding='utf-8') as f:
        f.write(content)
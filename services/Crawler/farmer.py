import requests
import json
from bs4 import BeautifulSoup

def crawl(url: str) -> str:
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    products = soup.find_all('div', class_='col-lg-2 col-md-4 col-4 product-loop prod-action-small')
    for product in products:
        #AttributeError: 'dict' object has no attribute 'find'
        url = product.find('a')['href']
        name = product.find('h3').text
        discountPrice = product.find('span', class_='price-del').text if product.find('span', class_='price-del') else None
        originalPrice = product.find('span', class_='price').text
        unit = ""
        product = {
            'url': url,
            'name': name,
            'discountPrice': discountPrice,
            'originalPrice': originalPrice,
            'unit': unit
        }
        products.append(product)
    return products

if __name__ == "__main__":
    url = 'https://farmersmarket.vn/search?type=product&q=filter=((title%3Aproduct%20contains%20s%E1%BB%AFa%20chua)%7C%7C(sku%3Aproduct%20contains%20s%E1%BB%AFa%20chua))'
    products = crawl(url)
    #write the products to a json file
    with open('farmer.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
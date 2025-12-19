import requests
import json
from bs4 import BeautifulSoup

def crawl(keyword: str, num_products: int) -> str:
    url = f'https://3sach.vn/search?type=product&q={keyword}'
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    products = soup.find_all('div', class_='col-md-2 col-sm-4 col-xs-4 product-loop')
    results = []

    for product in products:
        image_url = "https:" + product.find('picture').find('source')['data-srcset'] 
        url = "https://3sach.vn" + product.find('a')['href']
        name = product.find('h3').text
        delPrice = product.find('span', class_='price-del').text.replace('₫', '').replace(',', '') if product.find('span', class_='price-del') else None
        price = product.find('span', class_='price').text.replace('₫', '').replace(',', '')
        
        product = {
            'image_url': image_url,
            'url': url,
            'name': name,
            'discountPrice': int(price) if delPrice else None,
            'originalPrice': int(delPrice) if delPrice else int(price),
            'unit': None
        }
        results.append(product)
    return results[:num_products]

if __name__ == "__main__":
    products = crawl("đậu hà lan đà lạt", 5)
    #write the products to a json file
    with open('3sach.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
import requests
import json
from bs4 import BeautifulSoup

def crawl(keyword: str, num_products: int) -> str:
    url = f'https://emartmall.com.vn/index.php?search={keyword}&submit_search=&route=product%2Fsearch&sub_category=true&description=true&search_category_id=&search_store_id=0&search_type=recent_search'
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    products = soup.find_all('div', class_='product-block desktop-pdt')
    results = []

    for product in products:
        image_url = product.find('img')['src']
        url = product.find('a')['href']
        name = product.find('div', class_='name').text        
        oldPrice = product.find('span', class_='price-old').text.replace('₫', '').replace('.', '') if product.find('span', class_='price-old') else None
        newPrice = product.find('span', class_='price-new').text.replace('₫', '').replace('.', '')
        
        product = {
            'image_url': image_url,
            'url': url,
            'name': name,
            'discountPrice': int(newPrice) if oldPrice else None,
            'originalPrice': int(oldPrice) if oldPrice else int(newPrice),
            'unit': None
        }
        results.append(product)
    return results[:num_products]

if __name__ == "__main__":
    products = crawl("đậu hà lan đà lạt", 5)
    #write the products to a json file
    with open('emart.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
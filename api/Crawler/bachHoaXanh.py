import requests
import json
import os

def fetch_data(keyword: str, num_products: int):
    url = "https://api.bachhoaxanh.com/gw/search/v2/DataSearch"

    payload = {
        "keywords": keyword,
        "provinceId": 1027,
        "storeId": 2546,
        "pageIndex": 0,
        "pageSize": num_products,
        "sortStr": None
    }

    headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7',
        'access-control-allow-origin': '*',
        'authorization': 'Bearer FAE5CCD05988F486F188CFC12542B26A',
        'content-type': 'application/json',
        'customer-id': '',
        'deviceid': 'd870f77d-7862-4763-b805-81f629a7cb6c',
        'origin': 'https://www.bachhoaxanh.com',
        'platform': 'webnew',
        'priority': 'u=1, i',
        'referer': f'https://www.bachhoaxanh.com/tim-kiem?key={requests.utils.quote(keyword)}',
        'referer-url': f'https://www.bachhoaxanh.com/tim-kiem?key={requests.utils.quote(keyword)}',
        'reversehost': 'http://bhxapi.live',
        'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'xapikey': 'bhx-api-core-2022'
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        response_data = response.json()
        results = []
        
        products = response_data.get('data', {}).get('products', [])
        
        for product in products[0:num_products]:
            image_url = product.get('avatar')
            url = "https://www.bachhoaxanh.com" + product.get('url', '')
            name = product.get('name')
            
            price_info = product.get('productPrices', [{}])[0]
            current_price = int(price_info.get('price', 0))
            original_price = int(price_info.get('sysPrice', 0))
            
            if original_price == 0:
                original_price = current_price

            discount_price = current_price if current_price < original_price else None
            
            unit = product.get('unit')
            quantity = price_info.get('quantity', 0)
            
            product_obj = {
                'image_url': image_url,
                'url': url,
                'name': name,
                'discountPrice': discount_price,
                'originalPrice': original_price,
                'unit': unit,
                'quantity': quantity
            }
            results.append(product_obj)
        return results

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

if __name__ == "__main__":
    # save the json to a file in the same directory as the script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, 'bachhoaxanh.json')
    
    result = fetch_data("xoài cát hòa lộc chín", 5)
    if result is not None:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(json.dumps(result, indent=2, ensure_ascii=False))

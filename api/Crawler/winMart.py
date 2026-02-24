import requests
import json
import os

def fetch_data(keyword: str, num_products: int):
    url = "https://api-crownx.winmart.vn/ss/api/v2/public/winmart/item-search"

    headers = {
        'accept': 'application/json',
        'accept-language': 'en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7',
        'content-type': 'application/json',
        'origin': 'https://winmart.vn',
        'priority': 'u=1, i',
        'referer': 'https://winmart.vn/',
        'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'x-api-merchant': 'WCM'
    }

    payload = {
        "keyword": keyword,
        "pageNumber": 1,
        "storeNo": "1535",
        "storeGroupCode": "1998",
        "pageSize": num_products,
        "applicationType": "Winmart"
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        results = []
        items = data.get('data', [])
        
        if not items:
            return []

        for item in items:
            price_info = item.get('price', {})
            current_price = price_info.get('salePrice', 0)
            original_price = price_info.get('originPrice', 0)
            
            if original_price == 0:
                original_price = current_price
            
            discount_price = current_price if current_price < original_price else None
            
            # Construct product object
            product = {
                'image_url': item.get('image'),
                'url': f"https://winmart.vn/{item.get('seoName')}",
                'name': item.get('description'),
                'discountPrice': discount_price,
                'originalPrice': original_price,
                'unit': item.get('uomName'),
                'quantity': item.get('warehouse', {}).get('availableQuantity', 0)
            }
            results.append(product)
            
        return results

    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

if __name__ == "__main__":
    # save the json to a file in the same directory as the script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, 'winmart.json')
    
    result = fetch_data("sữa chua", 5)
    if result:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(json.dumps(result, indent=2, ensure_ascii=False))

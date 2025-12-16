import requests
import json
import os

def fetch_data(keyword: str, num_products: int):
    url = "https://www.lottemart.vn/v1/p/mart/es/vi_nsg/products/search"

    payload = {
        "limit": 50,
        "offset": 1,
        "facet_filters": {},
        "fields": [
            "id", "sku", "name", "label", "price", "url_key", "image_url",
            "in_stock", "promotion", "stock_qty", "type_id",
            "custom_attribute.bundle_type", "ext_overall_rating",
            "ext_overall_review", "short_description", "bundle_options",
            "child_price", "child_stock", "configurable_options",
            "configurable_children", "custom_attribute"
        ],
        "where": {
            "query": keyword
        }
    }

    headers = {
        'accept': 'application/json',
        'accept-language': 'en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7',
        'content-type': 'application/json',
        'origin': 'https://www.lottemart.vn',
        'referer': 'https://www.lottemart.vn/vi-nsg/category',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Transform data
        products = []

        for item in data['data']['items'][0:num_products]:
            image_url = item.get('image_url')
            url = item.get('url_key')
            name = item.get('name')
            defaultPrice = item['price']['VND']['default']
            price = item['price']['VND']['price']
            unit = item['custom_attribute']['unit']

            product = {
                "image_url": image_url,
                "url": url,
                "name": name,
                "discountPrice": defaultPrice if defaultPrice != price else None,
                "originalPrice": price,
                "unit": unit
            }
            
            products.append(product)

        return products

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, 'lotte.json')
    
    result = fetch_data("thùng sữa chua vinamilk ít đường", 5)
    if result is not None:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(json.dumps(result, indent=2, ensure_ascii=False))

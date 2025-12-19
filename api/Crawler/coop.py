import requests
import json
import os

def fetch_data(keyword: str, num_products: int):
    url = "https://discovery.tekoapis.com/api/v2/search-skus-v2"

    payload = {
        "terminalId": 26595,
        "page": 1,
        "pageSize": 40,
        "query": keyword,
        "filter": {},
        "sorting": {
            "sort": "SORT_BY_UNSPECIFIED",
            "order": "ORDER_BY_UNSPECIFIED"
        },
        "returnFilterable": [],
        "isNeedFeaturedProducts": False
    }

    headers = {
        'Accept': '*/*',
        'Connection': 'keep-alive',
        'Origin': 'https://cooponline.vn',
        'Referer': 'https://cooponline.vn/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'content-type': 'application/json',
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        response = response.json()
        results = []
        for product in response['data']['products'][0:num_products]:
            image_url = product['imageUrl']
            url = "https://cooponline.vn/" + product['canonical']
            name = product['name']
            originalPrice = int(product['supplierRetailPrice'])
            discountPrice = int(originalPrice) - int(product['discountAmount'])
            unit = product['uomName']
            quantity = product['stockQty']
            product = {
                'image_url': image_url,
                'url': url,
                'name': name,
                'discountPrice': discountPrice if int(discountPrice) != int(originalPrice) else None,
                'originalPrice': originalPrice,
                'unit': unit,
                'quantity': quantity
            }
            results.append(product)
        return results

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

if __name__ == "__main__":
    # save the json to a file in the same directory as the script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, 'coop.json')
    
    result = fetch_data("sữa chua", 5)
    if result is not None:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(json.dumps(result, indent=2, ensure_ascii=False))

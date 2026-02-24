import requests
import json
import os

def fetch_data(keyword: str, num_products: int):
    url = "https://buyer-graphql.prod.kamereo.vn/"

    headers = {
        'Connection': 'keep-alive',
        'Origin': 'https://kamereo.vn',
        'Referer': 'https://kamereo.vn/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'accept': '*/*',
        'accept-language': 'vi',
        'content-type': 'application/json',
        'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'x-client-appname': 'BuyerWeb',
        'x-client-version': '3.8.1',
        'x-customheader': 'HCM',
        'x-timezone': 'Asia/Bangkok'
    }

    query_graphql = """query productSearch($sort: [ProductSort!]!, $filter: ProductFilter, $pagination: Pagination!, $isBoostKamereoProducts: Boolean, $isBoostSameProductGroups: Boolean, $aggregationOptions: AggregationOptions) {
  productSearch(
    sort: $sort
    filter: $filter
    pagination: $pagination
    isBoostKamereoProducts: $isBoostKamereoProducts
    isBoostSameProductGroups: $isBoostSameProductGroups
    aggregationOptions: $aggregationOptions
  ) {
    totalResults
    totalPage
    data {
      id
      imageUrl
      uom
      uomLocal
      price
      originalPrice
      savingAmount
      inStock
      name
      description
      priceV2 {
        price
        originalPrice
      }
    }
  }
}
"""

    payload = {
        "operationName": "productSearch",
        "variables": {
            "sort": [],
            "filter": {
                "query": keyword,
                "regionCode": "HCM"
            },
            "pagination": {
                "page": 0,
                "size": num_products
            },
            "aggregationOptions": {
                "includeOrigins": True,
                "includeBrands": True,
                "includeCategoriesAndSubCategories": True
            }
        },
        "query": query_graphql
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        results = []
        products = data.get('data', {}).get('productSearch', {}).get('data', [])
        
        if not products:
            return []

        for product in products:
            # Handle priceV2 if available, otherwise fallback
            price_info = product.get('priceV2') or {}
            
            # Use priceV2 price if available, else root price
            current_price = price_info.get('price')
            if current_price is None:
                current_price = product.get('price', 0)
                
            original_price = price_info.get('originalPrice')
            if original_price is None:
                original_price = product.get('originalPrice', 0)
                
            if original_price == 0:
                original_price = current_price

            discount_price = current_price if current_price < original_price else None

            # Construct product object
            item = {
                'image_url': product.get('imageUrl'),
                'url': f"https://kamereo.vn/product/{product.get('id')}", 
                'name': product.get('name'),
                'discountPrice': discount_price,
                'originalPrice': original_price,
                'unit': product.get('uomLocal') or product.get('uom'),
                'quantity': 1,
            }
            results.append(item)
            
        return results

    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

if __name__ == "__main__":
    # save the json to a file in the same directory as the script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, 'kamereo.json')
    
    result = fetch_data("hành lá", 5)
    if result:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(json.dumps(result, indent=2, ensure_ascii=False))

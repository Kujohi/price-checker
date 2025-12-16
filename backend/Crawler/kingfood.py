import requests
import json
import os

def fetch_data(keyword: str, num_products: int = 5):
    url = "https://onelife-api.kingfoodmart.com/v1/gateway/"

    payload = {
        "operationName": "Search",
        "variables": {
            "type": None,
            "target": "PRODUCT",
            "first": num_products,
            "keyword": keyword,
            "after": None
        },
        "query": """query Search($type: [SearchType], $keyword: String, $first: Int, $target: SearchTarget, $after: Cursor) {
  search(
    type: $type
    keyword: $keyword
    first: $first
    target: $target
    after: $after
  ) {
    edges {
      node {
        ... on ProductListingInfo {
          subCate
          variants {
            slug
            name
            discountPrice
            originalPrice
            unit {
              name
            }
          }
        }
      }
    }
  }
}"""
    }

    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        # Transform data
        products = []
        if data and 'data' in data and 'search' in data['data'] and 'edges' in data['data']['search']:
            for edge in data['data']['search']['edges']:
                node = edge.get('node', {})
                sub_cate = node.get('subCate', '')
                for variant in node.get('variants', []):
                    product = {
                        "url": f"https://kingfoodmart.com/{sub_cate}/{variant.get('slug')}",
                        "name": variant.get('name'),
                        "discountPrice": variant.get('discountPrice'),
                        "originalPrice": variant.get('originalPrice'),
                        "unit": variant.get('unit', {}).get('name')
                    }
                    products.append(product)

        print(json.dumps(products, indent=2, ensure_ascii=False))
        return products

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

if __name__ == "__main__":
    # save the json to a file in the same directory as the script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, 'kingfoodmart.json')
    
    result = fetch_data("xoài cát hòa lộc", 5)
    if result is not None:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(json.dumps(result, indent=2, ensure_ascii=False))

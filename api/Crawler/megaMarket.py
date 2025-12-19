import requests
import json
import os
import urllib.parse

def fetch_data(keyword: str, num_products: int = 5):
    url = "https://online.mmvietnam.com/graphql"

    query = """
    query ProductSearch($currentPage:Int=1$inputText:String!$pageSize:Int=24$filters:ProductAttributeFilterInput!$sort:ProductAttributeSortInput$asmUid:String$phoneNumber:String){products(currentPage:$currentPage pageSize:$pageSize search:$inputText filter:$filters sort:$sort asm_uid:$asmUid phone_number:$phoneNumber){items{...ProductFragment tracking_url __typename}is_use_smart_search cdp_filter{label count attribute_code options{label value __typename}position __typename}aggregations{label count attribute_code options{label value __typename}position __typename}page_info{total_pages __typename}total_count __typename}}fragment ProductFragment on ProductInterface{id uid name ecom_name is_alcohol categories{uid breadcrumbs{category_uid __typename}name __typename}mm_product_type unit_ecom url_suffix dnr_price_search_page{event_id event_name __typename}art_no price{regularPrice{amount{value currency __typename}__typename}__typename}price_range{maximum_price{final_price{currency value __typename}regular_price{currency value __typename}discount{amount_off __typename}__typename}__typename}sku small_image{url __typename}rating_summary stock_status __typename url_key canonical_url product_label{label_id label_description label_name label_status label_from_date label_to_date label_priority label_type stores customer_groups product_image{type url position display text text_color text_font text_size shape_type shape_color label_size label_size_mobile custom_css use_default __typename}category_image{type url position display text text_color text_font text_size shape_type shape_color label_size label_size_mobile custom_css __typename}__typename}}
    """

    variables = {
        "currentPage": 1,
        "pageSize": num_products,
        "filters": {
            "category_uid": {
                "in": []
            }
        },
        "inputText": keyword,
        "asmUid": "100741569",
        "phoneNumber": "",
        "sort": {
            "relevance": "DESC"
        }
    }

    params = {
        "query": query,
        "operationName": "ProductSearch",
        "variables": json.dumps(variables)
    }

    headers = {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7',
        'content-type': 'application/json',
        'store': 'b2c_10010_vi',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://online.mmvietnam.com',
        'Referer': 'https://online.mmvietnam.com/'
    }

    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        results = []
        for item in data['data']['products']['items'][0:num_products]   :
            image_url = item['small_image']['url']
            url = 'https://online.mmvietnam.com/' + item['canonical_url']
            name = item.get('name')
            originalPrice = item['price_range']['maximum_price']['regular_price']['value']
            discountPrice = item['price_range']['maximum_price']['final_price']['value']
            unit = item['unit_ecom']
            quantity = item['stock_status']
            product = {
                'image_url': image_url,
                'url': url,
                'name': name,
                'originalPrice': originalPrice,
                'discountPrice': discountPrice if discountPrice != originalPrice else None,
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
    file_path = os.path.join(script_dir, 'megaMarket.json')
    
    result = fetch_data("xoài cát hòa lộc", 10)
    if result is not None:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(json.dumps(result, indent=2, ensure_ascii=False))

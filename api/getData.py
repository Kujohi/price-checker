from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import sys
import os

# Add the Crawler directory to the python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Crawler'))

import coop
import emart
import farmer
import kingfood
import lotte
import megaMarket
import three_sach
import bachHoaXanh
import kamereo
import winMart

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Product(BaseModel):
    name: str
    url: str
    image_url: Optional[str] = None
    discountPrice: Optional[int] = None
    originalPrice: Optional[int] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    source: str

class SearchRequest(BaseModel):
    keyword: str
    num_products: Optional[int] = 10

class SearchResponse(BaseModel):
    keyword: str
    results: List[Product]

async def run_crawler(crawler_module, keyword: str, source_name: str, num_products) -> List[Product]:
    try:
        data = []
        if source_name == 'Coopmart':
            data = await asyncio.to_thread(crawler_module.fetch_data, keyword, num_products)
        elif source_name == 'Emart':
            data = await asyncio.to_thread(crawler_module.crawl, keyword, num_products)
        elif source_name == 'Farmers Market':
            data = await asyncio.to_thread(crawler_module.crawl, keyword, num_products)
        elif source_name == 'KingFoodmart':
            data = await asyncio.to_thread(crawler_module.fetch_data, keyword, num_products)
        elif source_name == 'Lottemart':
            data = await asyncio.to_thread(crawler_module.fetch_data, keyword, num_products)
        elif source_name == 'MegaMarket':
            data = await asyncio.to_thread(crawler_module.fetch_data, keyword, num_products)
        elif source_name == '3Sach':
            data = await asyncio.to_thread(crawler_module.crawl, keyword, num_products)
        elif source_name == 'BachHoaXanh':
            data = await asyncio.to_thread(crawler_module.fetch_data, keyword, num_products)
        elif source_name == 'Kamereo':
            data = await asyncio.to_thread(crawler_module.fetch_data, keyword, num_products)
        elif source_name == 'WinMart':
            data = await asyncio.to_thread(crawler_module.fetch_data, keyword, num_products)
        
        if not data:
            return []

        # Standardize results to Product model
        products = []
        for item in data:
            products.append(Product(
                name=item.get('name', '') or '',
                url=item.get('url', '') or '',
                image_url=item.get('image_url'),
                discountPrice=item.get('discountPrice'),
                originalPrice=item.get('originalPrice'),
                unit=item.get('unit'),
                quantity=item.get('quantity'),
                source=source_name
            ))
        return products

    except Exception as e:
        print(f"Error running crawler {source_name}: {e}")
        return []

@app.post("/api/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    keyword = request.keyword
    num_products = request.num_products
    
    tasks = [
        run_crawler(coop, keyword, "Coopmart", num_products),
        run_crawler(emart, keyword, "Emart", num_products),
        run_crawler(farmer, keyword, "Farmers Market", num_products),
        run_crawler(kingfood, keyword, "KingFoodmart", num_products),
        run_crawler(lotte, keyword, "Lottemart", num_products),
        run_crawler(megaMarket, keyword, "MegaMarket", num_products),
        run_crawler(three_sach, keyword, "3Sach", num_products),
        run_crawler(bachHoaXanh, keyword, "BachHoaXanh", num_products),
        run_crawler(kamereo, keyword, "Kamereo", num_products),
        run_crawler(winMart, keyword, "WinMart", num_products),
    ]
    
    results_list = await asyncio.gather(*tasks)
    
    # Flatten results
    all_products = []
    for results in results_list:
        all_products.extend(results)
    
    return SearchResponse(keyword=keyword, results=all_products)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

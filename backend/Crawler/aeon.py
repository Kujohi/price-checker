import time
import json
import os
import urllib.parse
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Try to import undetected_chromedriver, fallback to standard selenium
try:
    import undetected_chromedriver as uc
    USE_UC = True
except ImportError:
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from webdriver_manager.chrome import ChromeDriverManager
    USE_UC = False
    print("undetected-chromedriver not found. Install it for better results: pip install undetected-chromedriver")

def crawl_aeon(keyword):
    # Setup Chrome options
    if USE_UC:
        options = uc.ChromeOptions()
    else:
        options = Options()
        # Add evasion arguments for standard selenium
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)

    # options.add_argument('--headless') 
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    # Initialize driver
    try:
        if USE_UC:
            driver = uc.Chrome(options=options)
        else:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
            # Execute CDP commands to hide webdriver
            driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                "source": """
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    })
                """
            })
    except Exception as e:
        print(f"Error initializing driver: {e}")
        return []

    products = []
    
    try:
        # Construct URL (handle encoding)
        encoded_keyword = urllib.parse.quote(keyword)
        url = f"https://aeoneshop.com/products/search/{encoded_keyword}"
        print(f"Navigating to {url}")
        driver.get(url)
        
        # Wait for page load
        time.sleep(5)
        
        # Check for DataDome or Captcha
        page_title = driver.title.lower()
        if "verification required" in page_title or "datadome" in driver.page_source:
            print("\n!!! BOT PROTECTION DETECTED !!!")
            print("Please solve the CAPTCHA manually in the browser window.")
            print("Waiting for you to solve it...")
            
            # Wait until the title changes or user presses Enter in console (simulated by waiting for url change)
            current_url = driver.current_url
            while "aeoneshop.com" in driver.current_url:
                if "verification" not in driver.title.lower() and "datadome" not in driver.page_source.lower():
                    # Double check if we see products
                    try:
                        # Look for common product elements or search results
                        if len(driver.find_elements(By.CSS_SELECTOR, "div.product-item, div.item-product, .product-grid")) > 0:
                            print("Captcha solved! Proceeding...")
                            break
                    except:
                        pass
                
                time.sleep(1)
                # print("Waiting...", end='\r')
        
        print("Page loaded. Extracting data...")
        time.sleep(3) # Let dynamic content load
        
        # Save source for development of parser
        script_dir = os.path.dirname(os.path.abspath(__file__))
        debug_path = os.path.join(script_dir, 'aeon_result.html')
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        print(f"Saved result HTML to {debug_path}")
        
        # TODO: Add extraction logic here once we have the HTML structure
        # Attempting to guess selectors based on common patterns
        product_elements = driver.find_elements(By.CSS_SELECTOR, ".product-item, .item-product, .product_box")
        
        if not product_elements:
             # Try another selector based on investigation or raw HTML
             product_elements = driver.find_elements(By.XPATH, "//div[contains(@class, 'product')]")

        print(f"Found {len(product_elements)} potential product elements.")

    except Exception as e:
        print(f"Error during crawling: {e}")
    finally:
        # Keep browser open for a bit to debug if needed, or close
        # driver.quit()
        pass
        
    return products

if __name__ == "__main__":
    crawl_aeon("sữa chua vinamilk")


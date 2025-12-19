/// <reference types="vite/client" />
import Groq from 'groq-sdk';
import { MarketAnalysis, PricePoint } from "../types";

// Helper function to get API Key using round-robin or random selection
const getGroqApiKey = () => {
  const keys = [
    import.meta.env.VITE_GROQ_API_KEY_1 || process.env.GROQ_API_KEY_1,
    import.meta.env.VITE_GROQ_API_KEY_2 || process.env.GROQ_API_KEY_2,
    import.meta.env.VITE_GROQ_API_KEY_3 || process.env.GROQ_API_KEY_3,
  ].filter(Boolean); // Remove undefined/null keys

  if (keys.length === 0) return null;
  
  // Randomly select a key to distribute load
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
};

export const fetchProductIntelligence = async (query: string): Promise<MarketAnalysis> => {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error("API Key not found");

  const groq = new Groq({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage if not proxying
  });

  // Step 1: Fetch Data from Backend
  // We call the local python backend to get raw product data
  let searchData;
  try {
      const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              keyword: query,
              num_products: 10 // Increased to get more data
          }),
      });
      
      if (!response.ok) {
          throw new Error(`Backend error: ${response.statusText}`);
      }
      
      const rawData = await response.json();
      
      // Assign IDs to each product
      searchData = rawData.results.map((item: any, index: number) => ({
          ...item,
          id: index + 1
      }));

  } catch (error) {
      console.error("Failed to fetch from backend:", error);
      throw new Error("Failed to connect to search service. Is the backend running?");
  }

  // Pre-filter: Keyword matching
  // Only keep products where the name contains at least 2 words from the query (if query has >= 2 words)
  // or 1 word if query is single word.
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const minMatches = queryWords.length >= 2 ? 2 : 1;

  const filteredSearchData = searchData.filter((item: any) => {
    const productName = (item.name || "").toLowerCase();
    let matches = 0;
    for (const word of queryWords) {
      if (productName.includes(word)) {
        matches++;
      }
    }
    return matches >= minMatches;
  });

  // Create simplified data for the model (id, name, unit)
  const simplifiedData = filteredSearchData.map((item: any) => ({
      id: item.id,
      name: item.name,
  }));

  // Step 2: Analysis & Filtering Phase
  // We feed the simplified data into the model to filter relevant products.
  const systemPrompt = `
    Bạn là một trợ lý phân tích dữ liệu chính xác.
    Nhiệm vụ của bạn là lọc danh sách sản phẩm dựa trên truy vấn tìm kiếm "${query}".
    Xác định danh sách các sản phẩm liên quan đến truy vấn và loại bỏ các sản phẩm không liên quan hay không chính xác với từ khóa tìm kiếm.
    Sản phẩm hợp lệ phải đi riêng lẻ, không đi theo combo.
    Nhận thức được các tên đồng nghĩa, ví dụ: (lô lô hay lollo, cherry hay sơ ri,...).
    Nếu số lượng sản phẩm quá ít <= 2 thì có thể bỏ qua một số yếu tố xét hợp lệ như vùng hay khối lượng
    
    Xuất kết quả dưới dạng JSON với cấu trúc sau:
    {
      "valid_product_ids": {
        "product_id": int,
        "product_name": string,
      },
      "searchSummary": "string (Một tóm tắt ngắn gọn 1 câu về những gì tìm thấy, bằng tiếng Việt)"
    }
  `;

  const userPrompt = `
    Query: "${query}"
    
    DATA cần xử lý:
    ${JSON.stringify(simplifiedData, null, 2)}
  `;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
    temperature: 0, // Low temperature for deterministic output
    response_format: { type: "json_object" }
  });

  const jsonText = chatCompletion.choices[0]?.message?.content;
  if (!jsonText) {
    throw new Error("Failed to structure data.");
  }

  const structuredData = JSON.parse(jsonText);
  // Extract product IDs from the new structure: array of objects { product_id, product_name }
  const validItems = structuredData.valid_product_ids || [];
  const validIds = Array.isArray(validItems) 
    ? validItems.map((item: any) => item.product_id)
    : [];

  // Post-process: Map IDs back to full product objects
  const validProducts: PricePoint[] = validIds.map((id: number) => {
       const item = searchData.find((p: any) => p.id === id);
       if (!item) return null;

       const price = item.discountPrice !== null && item.discountPrice !== undefined ? item.discountPrice : item.originalPrice;

       return {
          storeName: item.source,
          price: price, 
          originalPrice: item.originalPrice,
          currency: "VND", // Assuming VND
          productTitle: item.name,
          url: item.url,
          image_url: item.image_url,
          unit: item.unit,
          quantity: item.quantity
       };
  }).filter((item: any) => item !== null);

  return {
    query,
    searchSummary: structuredData.searchSummary || `Tìm thấy ${validProducts.length} sản phẩm cho ${query}.`,
    products: validProducts,
    lastUpdated: new Date().toISOString()
  };
};

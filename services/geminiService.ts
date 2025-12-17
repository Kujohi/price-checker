/// <reference types="vite/client" />
import Groq from 'groq-sdk';
import { MarketAnalysis, PricePoint } from "../types";

export const fetchProductIntelligence = async (query: string): Promise<MarketAnalysis> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
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

  // Create simplified data for the model (id, name, unit)
  const simplifiedData = searchData.map((item: any) => ({
      id: item.id,
      name: item.name,
      unit: item.unit
  }));

  // Step 2: Analysis & Filtering Phase
  // We feed the simplified data into the model to filter relevant products.
  const systemPrompt = `
    Bạn là một trợ lý phân tích dữ liệu chính xác.
    Nhiệm vụ của bạn là lọc danh sách sản phẩm dựa trên truy vấn tìm kiếm "${query}".
    Xác định các sản phẩm liên quan đến truy vấn và phù hợp với ý định của người dùng.
    Loại bỏ các sản phẩm không liên quan hoặc các kết quả rõ ràng sai lệch.
    
    Bạn phải xuất ra một đối tượng JSON hợp lệ với cấu trúc sau:
    {
      "valid_product_ids": [number, number],
      "searchSummary": "string (Một tóm tắt ngắn gọn 1 câu về những gì tìm thấy, bằng tiếng Việt)"
    }
  `;

  const userPrompt = `
    Query: "${query}"
    
    DATA TO PROCESS:
    ${JSON.stringify(simplifiedData, null, 2)}
  `;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0, // Low temperature for deterministic output
    response_format: { type: "json_object" }
  });

  const jsonText = chatCompletion.choices[0]?.message?.content;
  if (!jsonText) {
    throw new Error("Failed to structure data.");
  }

  const structuredData = JSON.parse(jsonText);
  const validIds = structuredData.valid_product_ids || [];

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
          unit: item.unit
       };
  }).filter((item: any) => item !== null);

  return {
    query,
    searchSummary: structuredData.searchSummary || `Tìm thấy ${validProducts.length} sản phẩm cho ${query}.`,
    products: validProducts,
    lastUpdated: new Date().toISOString()
  };
};

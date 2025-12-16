/// <reference types="vite/client" />
import Groq from 'groq-sdk';
import { MarketAnalysis, ProductVariant, PricePoint } from "../types";

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
      const response = await fetch('http://localhost:8000/search', {
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

  // Step 2: Analysis & Structuring Phase
  // We feed the simplified data into the model to get groups of IDs.
  // We include the schema description in the prompt since we aren't using a strict schema object like Gemini's SDK.
  const systemPrompt = `
    You are a precise data analysis assistant.
    Your task is to group a list of products based on their similarity (e.g., same product variant, size, weight, or pack quantity).
    Ignore products that are clearly irrelevant to the query.
    
    You must output a valid JSON object with the following structure:
    {
      "grouped_products": [
        {
          "group_name": "string (e.g., '12-Pack Cans', '2L Bottle')",
          "product_ids": [number, number]
        }
      ],
      "searchSummary": "string (A brief 2-sentence summary of the price landscape found)"
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

  // Post-process: Map IDs back to full product objects and calculate stats
  const processedVariants: ProductVariant[] = structuredData.grouped_products.map((group: any) => {
    // Filter and map back to full objects using IDs
    const items: PricePoint[] = group.product_ids
        .map((id: number) => searchData.find((p: any) => p.id === id))
        .filter((item: any) => item !== undefined) // Safety check
        .map((item: any) => {
            // Determine effective price
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
        });

    const prices = items.map(i => i.price).filter(p => p !== null && p !== undefined);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const sum = prices.reduce((a, b) => a + b, 0);
    const avgPrice = prices.length > 0 ? sum / prices.length : 0;

    return {
      variantName: group.group_name,
      description: `Found ${items.length} offers for this variant.`,
      items: items,
      minPrice,
      maxPrice,
      averagePrice: avgPrice
    };
  }).filter((variant: ProductVariant) => variant.items.length > 0); // Remove empty groups

  return {
    query,
    searchSummary: structuredData.searchSummary || `Found ${processedVariants.length} variants for ${query}.`,
    variants: processedVariants,
    lastUpdated: new Date().toISOString()
  };
};

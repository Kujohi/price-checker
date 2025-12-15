import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MarketAnalysis, ProductVariant } from "../types";

// Define the schema for the structured output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    variants: {
      type: Type.ARRAY,
      description: "List of distinct product variants found (grouped by size, weight, or pack quantity).",
      items: {
        type: Type.OBJECT,
        properties: {
          variantName: {
            type: Type.STRING,
            description: "A short, descriptive name for this group (e.g., '12-Pack Cans', '2L Bottle')."
          },
          description: {
            type: Type.STRING,
            description: "Brief description of this specific variant group."
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                storeName: { type: Type.STRING },
                price: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                productTitle: { type: Type.STRING },
                stockStatus: { type: Type.STRING, description: "In Stock, Out of Stock, or Unknown" }
              },
              required: ["storeName", "price", "currency", "productTitle"]
            }
          }
        },
        required: ["variantName", "items", "description"]
      }
    },
    searchSummary: {
      type: Type.STRING,
      description: "A brief 2-sentence summary of the price landscape found."
    }
  },
  required: ["variants", "searchSummary"]
};

export const fetchProductIntelligence = async (query: string): Promise<MarketAnalysis> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  // Step 1: Search Phase
  // We use the search tool to "crawl" the web for current data.
  // We cannot use JSON schema here because googleSearch is active.
  const searchModel = "gemini-2.5-flash";
  const searchPrompt = `
    Find current prices for the product: "${query}".
    Search across major US retailers including Walmart, Target, Amazon, Best Buy, Kroger, and Whole Foods.
    
    IMPORTANT:
    - Look for different variations (e.g., different sizes, colors, pack counts).
    - For EACH item found, list:
      1. The specific Store Name
      2. The exact Product Title
      3. The Price
      4. The specific Size/Unit/Variant details
    - Try to find at least 3-5 different price points for each variant if possible.
    - Be precise with numbers.
  `;

  const searchResponse = await ai.models.generateContent({
    model: searchModel,
    contents: searchPrompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const searchRawText = searchResponse.text;
  
  if (!searchRawText) {
    throw new Error("Failed to retrieve search results.");
  }

  // Step 2: Analysis & Structuring Phase
  // We feed the raw search text into the model again to structure it.
  const analysisPrompt = `
    You are a data extraction expert. 
    I will provide you with unstructured market research text containing product prices from various stores.
    
    Your task:
    1. Analyze the text and group products into distinct 'variants' (e.g., put all '2 Liter bottles' in one group, all '12-pack cans' in another).
    2. Extract the price, store, and title for each entry.
    3. Ignore irrelevant products or accessories that don't match the core query.
    4. Output strictly in JSON format matching the schema.

    Input Text:
    ${searchRawText}
  `;

  const structureResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: analysisPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    },
  });

  const jsonText = structureResponse.text;
  if (!jsonText) {
    throw new Error("Failed to structure data.");
  }

  const structuredData = JSON.parse(jsonText);

  // Post-process to calculate derived stats (min/max/avg)
  const processedVariants: ProductVariant[] = structuredData.variants.map((v: any) => {
    const prices = v.items.map((i: any) => i.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const sum = prices.reduce((a: number, b: number) => a + b, 0);
    const avgPrice = sum / prices.length;

    return {
      ...v,
      minPrice,
      maxPrice,
      averagePrice: avgPrice
    };
  });

  return {
    query,
    searchSummary: structuredData.searchSummary,
    variants: processedVariants,
    lastUpdated: new Date().toISOString()
  };
};

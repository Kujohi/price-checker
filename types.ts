export interface PricePoint {
  storeName: string;
  price: number;
  originalPrice?: number;
  currency: string;
  productTitle: string;
  stockStatus?: string;
  url?: string;
  image_url?: string;
  unit?: string;
}

export interface ProductVariant {
  variantName: string; // e.g., "12-Pack 12oz Cans", "2 Liter Bottle"
  description: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  items: PricePoint[];
}

export interface MarketAnalysis {
  query: string;
  searchSummary: string;
  variants: ProductVariant[];
  lastUpdated: string;
}

export enum AppState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING', // Phase 1: Search Grounding
  ANALYZING = 'ANALYZING', // Phase 2: Structuring Data
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
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
  quantity?: number;
}

export interface ProductVariant {
  variantName: string;
  description: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  items: PricePoint[];
}

export interface MarketAnalysis {
  query: string;
  searchSummary: string;
  products: PricePoint[];
  lastUpdated: string;
}

export enum AppState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

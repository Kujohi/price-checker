import React, { useState } from 'react';
import { 
  BarChart3, 
  Activity, 
  AlertCircle, 
  Search,
  TrendingUp,
  Globe
} from 'lucide-react';
import SearchBar from './components/SearchBar';
import ProductGroup from './components/ProductGroup';
import { fetchProductIntelligence } from './services/geminiService';
import { AppState, MarketAnalysis } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisData, setAnalysisData] = useState<MarketAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setAppState(AppState.SEARCHING);
    setError(null);
    setAnalysisData(null);

    try {
      // Simulate state transition for UX feedback
      setTimeout(() => {
        if (appState !== AppState.ERROR) setAppState(AppState.ANALYZING);
      }, 3000); // Rough estimate for the first search call

      const data = await fetchProductIntelligence(query);
      setAnalysisData(data);
      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch price intelligence. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">PriceIntel<span className="text-emerald-500">AI</span></span>
          </div>
          <div className="text-sm text-slate-400 hidden sm:block">
            Intelligent Market Analysis
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400 mb-6">
            Track Prices Across the Web
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Stop manually checking Amazon, Walmart, and Target. Our AI agent crawls the web, 
            structures messy data, and groups products by variant to give you true price intelligence.
          </p>
          
          <SearchBar 
            onSearch={handleSearch} 
            isLoading={appState === AppState.SEARCHING || appState === AppState.ANALYZING} 
          />
        </div>

        {/* Status Indicators */}
        <div className="max-w-2xl mx-auto mb-12">
          {appState === AppState.SEARCHING && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center relative">
                <Globe className="w-6 h-6 text-indigo-400 animate-pulse" />
                <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full animate-ping"></div>
              </div>
              <p className="text-indigo-300 font-medium">Scanning retailers (Walmart, Target, Amazon)...</p>
            </div>
          )}

          {appState === AppState.ANALYZING && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
               <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center relative">
                <BarChart3 className="w-6 h-6 text-emerald-400 animate-pulse" />
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-ping"></div>
              </div>
              <p className="text-emerald-300 font-medium">AI is structuring data & grouping variants...</p>
            </div>
          )}

          {appState === AppState.ERROR && (
            <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-lg flex items-center gap-3 text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {appState === AppState.COMPLETE && analysisData && (
          <div className="animate-in slide-in-from-bottom-8 duration-700">
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Search className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-slate-400 font-medium text-sm uppercase">Search Query</h3>
                </div>
                <p className="text-xl font-bold text-white capitalize">{analysisData.query}</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-slate-400 font-medium text-sm uppercase">Variants Found</h3>
                </div>
                <p className="text-xl font-bold text-white">{analysisData.variants.length} Distinct Groups</p>
              </div>

               <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <h3 className="text-slate-400 font-medium text-sm uppercase">Market Insight</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {analysisData.searchSummary}
                </p>
              </div>
            </div>

            {/* Product Variants List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-white">Price Breakdown by Variant</h2>
                 <span className="text-xs text-slate-500">Last updated: {new Date(analysisData.lastUpdated).toLocaleTimeString()}</span>
              </div>
             
              {analysisData.variants.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                  <p className="text-slate-400">No structured pricing data could be extracted for this query. Try a more specific product name.</p>
                </div>
              ) : (
                analysisData.variants.map((variant, index) => (
                  <ProductGroup key={index} variant={variant} />
                ))
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;

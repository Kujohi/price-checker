import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  Activity, 
  AlertCircle, 
  Search,
  TrendingUp,
  Globe,
  Package,
  Download
} from 'lucide-react';
import SearchBar from './components/SearchBar';
import ProductCard from './components/ProductCard';
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
      }, 3000); 

      const data = await fetchProductIntelligence(query);
      
      // Sort products by price (low to high)
      if (data.products) {
        data.products.sort((a, b) => a.price - b.price);
      }

      setAnalysisData(data);
      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể lấy thông tin giá. Vui lòng thử lại.");
      setAppState(AppState.ERROR);
    }
  };

  const handleExportExcel = () => {
    if (!analysisData || !analysisData.products.length) return;

    // Prepare data for export
    const exportData = analysisData.products.map(p => ({
      'Tên Sản Phẩm': p.productTitle,
      'Cửa Hàng': p.storeName,
      'Giá (VND)': p.price,
      'Giá Gốc (VND)': p.originalPrice || '',
      'Đơn Vị': p.unit || '',
      'Link': p.url || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sản Phẩm");
    XLSX.writeFile(workbook, `Bao_Cao_Gia_${analysisData.query.replace(/\s+/g, '_')}.xlsx`);
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
            Phân Tích Thị Trường Thông Minh
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400 mb-6">
            Theo Dõi Giá Trên Toàn Web
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Không cần kiểm tra thủ công nhiều trang web. AI của chúng tôi sẽ thu thập dữ liệu, 
            lọc các kết quả không liên quan và hiển thị cho bạn những giao dịch tốt nhất.
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
              <p className="text-indigo-300 font-medium">Đang quét các nhà bán lẻ...</p>
            </div>
          )}

          {appState === AppState.ANALYZING && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
               <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center relative">
                <Package className="w-6 h-6 text-emerald-400 animate-pulse" />
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-ping"></div>
              </div>
              <p className="text-emerald-300 font-medium">AI đang lọc và xác minh sản phẩm...</p>
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
                  <h3 className="text-slate-400 font-medium text-sm uppercase">Từ Khóa Tìm Kiếm</h3>
                </div>
                <p className="text-xl font-bold text-white capitalize">{analysisData.query}</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-slate-400 font-medium text-sm uppercase">Sản Phẩm Tìm Thấy</h3>
                </div>
                <p className="text-xl font-bold text-white">{analysisData.products.length} Kết Quả</p>
              </div>

               <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <h3 className="text-slate-400 font-medium text-sm uppercase">Thông Tin Thị Trường</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {analysisData.searchSummary}
                </p>
              </div>
            </div>

            {/* Product List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">Kết Quả Sản Phẩm</h2>
                    <span className="text-xs text-slate-500">Cập nhật lúc: {new Date(analysisData.lastUpdated).toLocaleTimeString()}</span>
                 </div>
                 
                 <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                 >
                    <Download className="w-4 h-4" />
                    Xuất Excel
                 </button>
              </div>
             
              {analysisData.products.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                  <p className="text-slate-400">Không tìm thấy sản phẩm nào phù hợp. Vui lòng thử từ khóa khác.</p>
                </div>
              ) : (
                analysisData.products.map((product, index) => (
                  <ProductCard key={index} product={product} />
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

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './services/supabase';
import Login from './components/Login';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  Activity, 
  AlertCircle, 
  Search,
  TrendingUp,
  Globe,
  Package,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import SearchBar from './components/SearchBar';
import ProductCard from './components/ProductCard';
import { fetchProductIntelligence } from './services/geminiService';
import { AppState, MarketAnalysis, PricePoint } from './types';

interface BatchResult {
  query: string;
  products: PricePoint[];
  status: 'pending' | 'success' | 'error';
  error?: string;
  summary?: string;
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.warn('Error checking session:', error.message);
        setLoadingSession(false);
        return;
      }
      setSession(data.session);
      setLoadingSession(false);
    }).catch((err) => {
      console.error('Unexpected error checking session:', err);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisData, setAnalysisData] = useState<MarketAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Batch Processing State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchQueue, setBatchQueue] = useState<string[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [showBatchResults, setShowBatchResults] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (query: string) => {
    setAppState(AppState.SEARCHING);
    setError(null);
    setAnalysisData(null);
    setIsBatchMode(false);

    try {
      // Simulate state transition for UX feedback
      const loadingTimeout = setTimeout(() => {
        if (appState !== AppState.ERROR) setAppState(AppState.ANALYZING);
      }, 5000); 

      const data = await fetchProductIntelligence(query);
      
      // Clear timeout to prevent state overwrite if data comes back quickly
      clearTimeout(loadingTimeout);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        
        // Assume first column contains product names, skipping empty rows
        const queries = jsonData
          .map(row => row[0])
          .filter(cell => cell && typeof cell === 'string' && cell.trim().length > 0);

        if (queries.length > 0) {
          startBatchProcessing(queries);
        } else {
          setError("Không tìm thấy dữ liệu hợp lệ trong file Excel.");
          setAppState(AppState.ERROR);
        }
      } catch (err) {
        console.error("Error parsing Excel file:", err);
        setError("Lỗi khi đọc file Excel.");
        setAppState(AppState.ERROR);
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startBatchProcessing = async (queries: string[]) => {
    setIsBatchMode(true);
    setIsBatchProcessing(true);
    setBatchQueue(queries);
    setBatchResults([]);
    setCurrentBatchIndex(0);
    setAppState(AppState.SEARCHING); // Reuse searching state for UI indication

    const results: BatchResult[] = [];

    for (let i = 0; i < queries.length; i++) {
      setCurrentBatchIndex(i);
      const query = queries[i].toLowerCase();
      
      // Add a pending entry
      setBatchResults(prev => [...prev, { query, products: [], status: 'pending' }]);

      try {
        // Wait time (3 seconds) between calls to avoid rate limits
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 3000));

        const data = await fetchProductIntelligence(query);
        
        // Sort products
        if (data.products) {
          data.products.sort((a, b) => a.price - b.price);
        }

        const result: BatchResult = {
          query,
          products: data.products,
          status: 'success',
          summary: data.searchSummary
        };

        // Update the last entry with success
        setBatchResults(prev => {
          const newResults = [...prev];
          newResults[i] = result;
          return newResults;
        });
        results.push(result);

      } catch (err: any) {
        console.error(`Error fetching for ${query}:`, err);
        const errorResult: BatchResult = {
          query,
          products: [],
          status: 'error',
          error: err.message
        };
        setBatchResults(prev => {
          const newResults = [...prev];
          newResults[i] = errorResult;
          return newResults;
        });
        results.push(errorResult);
      }
    }

    setIsBatchProcessing(false);
    setAppState(AppState.COMPLETE);
  };

  const handleBatchExportExcel = () => {
    if (!batchResults.length) return;

    const exportData: any[] = [];

    batchResults.forEach(result => {
      if (result.status === 'success' && result.products.length > 0) {
        result.products.forEach(p => {
          exportData.push({
            'Từ Khóa': result.query,
            'Tên Sản Phẩm': p.productTitle,
            'Cửa Hàng': p.storeName,
            'Giá (VND)': p.price,
            'Giá Gốc (VND)': p.originalPrice || '',
            'Đơn Vị': p.unit || '',
            'Tồn Kho': p.quantity || '',
            'Link': p.url || ''
          });
        });
      } else {
        exportData.push({
          'Từ Khóa': result.query,
          'Trạng Thái': result.status === 'error' ? `Lỗi: ${result.error}` : 'Không tìm thấy sản phẩm'
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tong_Hop_Gia");
    XLSX.writeFile(workbook, `Bao_Cao_Gia_Hang_Loat_${new Date().toISOString().slice(0,10)}.xlsx`);
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
      'Tồn Kho': p.quantity || '',
      'Link': p.url || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sản Phẩm");
    XLSX.writeFile(workbook, `Bao_Cao_Gia_${analysisData.query.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

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
          <button
            onClick={handleSignOut}
            className="ml-4 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            Đăng xuất
          </button>
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
          
          <div className="flex flex-col items-center gap-4">
            <SearchBar 
              onSearch={handleSearch} 
              isLoading={appState === AppState.SEARCHING || appState === AppState.ANALYZING || isBatchProcessing} 
            />
            
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span>hoặc</span>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
                id="excel-upload"
              />
              <label 
                htmlFor="excel-upload"
                className={`flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors border border-slate-700 ${isBatchProcessing ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Tải lên Excel (Tìm kiếm hàng loạt)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Status Indicators (Single Search) */}
        {!isBatchMode && (
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
        )}

        {/* Batch Processing Status & Results */}
        {isBatchMode && (
          <div className="max-w-4xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {isBatchProcessing ? (
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {isBatchProcessing ? 'Đang xử lý danh sách...' : 'Hoàn tất xử lý danh sách'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Đã xử lý {batchResults.filter(r => r.status !== 'pending').length} / {batchQueue.length} sản phẩm
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowBatchResults(!showBatchResults)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {showBatchResults ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-slate-700 w-full">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${((batchResults.filter(r => r.status !== 'pending').length) / Math.max(batchQueue.length, 1)) * 100}%` }}
                ></div>
              </div>

              {/* Results List (Accordion Content) */}
              {showBatchResults && (
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {batchResults.map((result, idx) => (
                    <div key={idx} className="p-4 border-b border-slate-700/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono text-slate-500">#{idx + 1}</span>
                            <span className="font-medium text-slate-200">{result.query}</span>
                            {result.status === 'pending' && <span className="text-xs px-2 py-0.5 bg-indigo-900/50 text-indigo-300 rounded-full animate-pulse">Đang xử lý...</span>}
                            {result.status === 'error' && <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded-full">Lỗi</span>}
                            {result.status === 'success' && <span className="text-xs px-2 py-0.5 bg-emerald-900/50 text-emerald-300 rounded-full">{result.products.length} sản phẩm</span>}
                          </div>
                          {result.status === 'success' && result.products.length > 0 && (
                            <div className="text-sm text-slate-400 ml-6">
                              Giá tốt nhất: <span className="text-emerald-400 font-bold">{result.products[0].price.toLocaleString('vi-VN')}đ</span> tại {result.products[0].storeName}
                              {result.products[0].quantity !== undefined && <span> - Tồn kho: {result.products[0].quantity}</span>}
                            </div>
                          )}
                           {result.status === 'error' && (
                            <div className="text-sm text-red-400 ml-6">
                              {result.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Footer Actions */}
              <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end">
                <button
                  onClick={handleBatchExportExcel}
                  disabled={isBatchProcessing || batchResults.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {isBatchProcessing ? 'Đang xử lý...' : 'Xuất Báo Cáo Tổng Hợp'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Single Search Results Section (Only show if NOT in batch mode) */}
        {!isBatchMode && appState === AppState.COMPLETE && analysisData && (
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

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative z-10">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-slate-900 rounded-lg">
          <Search className="absolute left-4 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Tìm kiếm sản phẩm (ví dụ: 'Coca Cola', 'Tai nghe Sony')"
            className="w-full py-4 pl-12 pr-4 bg-transparent text-slate-100 placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tìm'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, ExternalLink } from 'lucide-react';
import { ProductVariant } from '../types';
import PriceChart from './PriceChart';

interface ProductGroupProps {
  variant: ProductVariant;
}

const ProductGroup: React.FC<ProductGroupProps> = ({ variant }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Find best price
  const bestPriceItem = variant.items.reduce((prev, curr) => 
    prev.price < curr.price ? prev : curr
  );

  const formatPrice = (price: number, currency: string = 'VND') => {
      // Use vi-VN locale for formatting
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currency }).format(price);
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden mb-6 transition-all hover:border-slate-600">
      <div 
        className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer bg-slate-800/80"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            {variant.variantName}
            <span className="text-xs font-normal text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
              {variant.items.length} stores
            </span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">{variant.description}</p>
        </div>

        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Best Price</p>
            <p className="text-xl font-bold text-emerald-400">
              {formatPrice(bestPriceItem.price, bestPriceItem.currency)}
            </p>
            <p className="text-xs text-slate-500">at {bestPriceItem.storeName}</p>
          </div>
          
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Average</p>
            <p className="text-lg font-semibold text-slate-200">
               {formatPrice(variant.averagePrice)}
            </p>
          </div>

          <button className="text-slate-400 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 border-t border-slate-700 bg-slate-900/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart Section */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Price Comparison</h4>
              <PriceChart items={variant.items} variantName={variant.variantName} />
            </div>

            {/* List Section */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Store Listings</h4>
              {variant.items.sort((a,b) => a.price - b.price).map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    idx === 0 
                      ? 'bg-emerald-900/10 border-emerald-500/30' 
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {item.image_url ? (
                        <div className="relative w-12 h-12 flex-shrink-0">
                             <img src={item.image_url} alt={item.productTitle} className="w-full h-full object-contain rounded bg-white p-1" />
                             {idx === 0 && <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5"><ShoppingCart className="w-3 h-3 text-white" /></div>}
                        </div>
                    ) : (
                         <div className={`p-2 rounded-full ${idx === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                           <ShoppingCart className="w-4 h-4" />
                         </div>
                    )}
                   
                    <div className="min-w-0">
                      <p className="font-medium text-slate-200 truncate">{item.storeName}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]" title={item.productTitle}>{item.productTitle}</p>
                       {item.unit && <p className="text-[10px] text-slate-400">Unit: {item.unit}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                      <p className={`font-bold ${idx === 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {formatPrice(item.price, item.currency)}
                      </p>
                      {item.originalPrice && item.originalPrice > item.price && (
                         <p className="text-[10px] text-slate-500 line-through">
                              {formatPrice(item.originalPrice, item.currency)}
                         </p>
                      )}
                      {item.stockStatus && (
                         <p className="text-[10px] text-slate-500">{item.stockStatus}</p>
                      )}
                    </div>
                    {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-400">
                             <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGroup;

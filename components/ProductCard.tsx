import React from 'react';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import { PricePoint } from '../types';

interface ProductCardProps {
  product: PricePoint;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatPrice = (price: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currency }).format(price);
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-4 overflow-hidden">
        {product.image_url ? (
            <div className="relative w-16 h-16 flex-shrink-0">
                 <img src={product.image_url} alt={product.productTitle} className="w-full h-full object-contain rounded bg-white p-1" />
            </div>
        ) : (
             <div className="p-3 rounded-full bg-slate-700 text-slate-400">
               <ShoppingCart className="w-6 h-6" />
             </div>
        )}
       
        <div className="min-w-0">
          <p className="font-medium text-slate-200">{product.storeName}</p>
          <h4 className="text-sm text-slate-400 font-medium max-w-[300px]" title={product.productTitle}>
            {product.productTitle}
          </h4>
           {product.unit && <p className="text-xs text-slate-500">Đơn vị: {product.unit}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-6">
         <div className="text-right">
          <p className="font-bold text-xl text-emerald-400">
            {formatPrice(product.price, product.currency)}
          </p>
          {product.originalPrice && product.originalPrice > product.price && (
             <p className="text-xs text-slate-500 line-through">
                  {formatPrice(product.originalPrice, product.currency)}
             </p>
          )}
          {product.stockStatus && (
             <p className="text-xs text-slate-500">{product.stockStatus}</p>
          )}
        </div>
        {product.url && (
            <a href={product.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-all">
                 <ExternalLink className="w-5 h-5" />
            </a>
        )}
      </div>
    </div>
  );
};

export default ProductCard;

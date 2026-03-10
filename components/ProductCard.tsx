'use client';

import { Product } from '@/lib/supabase';
import StockBadge from './StockBadge';

type ProductCardProps = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onStockChange: (id: string, newStock: number) => void;
};

export default function ProductCard({ product, onEdit, onDelete, onStockChange }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          {product.taxable && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
              과세
            </span>
          )}
        </div>
        <StockBadge stock={product.stock} />
      </div>

      {product.agency && (
        <p className="text-sm text-rose-400 mb-4">
          <span className="text-gray-500">대행사:</span> {product.agency}
        </p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm text-gray-600">재고:</label>
        <input
          type="number"
          min="0"
          value={product.stock}
          onChange={(e) => onStockChange(product.id, parseInt(e.target.value) || 0)}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-rose-300 focus:border-rose-300"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 px-3 py-2 text-sm text-rose-400 border border-rose-300 rounded-md hover:bg-rose-50 transition-colors"
        >
          수정
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

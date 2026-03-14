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
    <div className="card p-6 group">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
               style={{ background: 'linear-gradient(135deg, rgba(255,140,66,0.15) 0%, rgba(230,57,70,0.1) 100%)' }}>
            🎁
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            {product.agency && (
              <p className="text-sm text-gray-400">{product.agency}</p>
            )}
          </div>
        </div>
        {product.taxable && (
          <span className="badge badge-warning">과세</span>
        )}
      </div>

      {/* 재고 정보 */}
      <div className="flex items-center justify-between py-4 border-t border-b border-gray-100">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">재고</label>
          <input
            type="number"
            min="0"
            value={product.stock}
            onChange={(e) => onStockChange(product.id, parseInt(e.target.value) || 0)}
            className="w-20 px-3 py-2 text-center font-semibold text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <StockBadge stock={product.stock} />
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 btn-secondary"
        >
          수정
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 btn-danger"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

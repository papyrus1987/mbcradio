'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, Product } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';

type Props = {
  initialProducts: Product[];
};

export default function ProductsClient({ initialProducts }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  async function handleStockChange(id: string, newStock: number) {
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id);

    if (error) {
      console.error('Error updating stock:', error);
      alert('재고 수정에 실패했습니다.');
    } else {
      setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 이 상품을 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      alert('상품 삭제에 실패했습니다.');
    } else {
      setProducts(products.filter(p => p.id !== id));
      router.refresh();
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData(e.currentTarget);
    const updatedProduct = {
      name: formData.get('name') as string,
      agency: formData.get('agency') as string || null,
      taxable: formData.get('taxable') === 'on',
    };

    const { error } = await supabase
      .from('products')
      .update(updatedProduct)
      .eq('id', editingProduct.id);

    if (error) {
      console.error('Error updating product:', error);
      alert('상품 수정에 실패했습니다.');
    } else {
      setProducts(products.map(p =>
        p.id === editingProduct.id ? { ...p, ...updatedProduct } : p
      ));
      setEditingProduct(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">상품 관리</h1>
          <p className="text-gray-500 mt-1">총 <span className="font-semibold text-primary">{products.length}</span>개의 상품</p>
        </div>
        <Link href="/products/new" className="btn-primary">
          <span>+</span>
          상품 추가
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <span className="text-3xl">🎁</span>
          </div>
          <p className="text-gray-600 font-semibold text-lg">등록된 상품이 없습니다</p>
          <Link href="/products/new" className="mt-4 btn-primary">
            첫 상품을 추가해보세요
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <ProductCard
                product={product}
                onEdit={setEditingProduct}
                onDelete={handleDelete}
                onStockChange={handleStockChange}
              />
            </div>
          ))}
        </div>
      )}

      {/* 수정 모달 */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                   style={{ background: 'linear-gradient(135deg, rgba(255,140,66,0.15) 0%, rgba(230,57,70,0.1) 100%)' }}>
                🎁
              </div>
              <h2 className="text-xl font-bold text-gray-900">상품 수정</h2>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="input-label">
                  상품명 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProduct.name}
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="input-label">대행사</label>
                <input
                  type="text"
                  name="agency"
                  defaultValue={editingProduct.agency || ''}
                  placeholder="대행사명을 입력하세요"
                  className="input"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  name="taxable"
                  id="edit-taxable"
                  defaultChecked={editingProduct.taxable}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="edit-taxable" className="text-sm font-medium text-gray-700">
                  과세 상품 (주민등록번호 입력 필요)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

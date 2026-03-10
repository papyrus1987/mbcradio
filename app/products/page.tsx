'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Product } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
        <Link
          href="/products/new"
          className="px-4 py-2 bg-rose-400 text-white rounded-md hover:bg-rose-500 transition-colors"
        >
          상품 추가
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">등록된 상품이 없습니다.</p>
          <Link
            href="/products/new"
            className="mt-4 inline-block text-rose-400 hover:text-rose-500"
          >
            첫 상품을 추가해보세요
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={setEditingProduct}
              onDelete={handleDelete}
              onStockChange={handleStockChange}
            />
          ))}
        </div>
      )}

      {/* 수정 모달 */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">상품 수정</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상품명
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProduct.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    대행사
                  </label>
                  <input
                    type="text"
                    name="agency"
                    defaultValue={editingProduct.agency || ''}
                    placeholder="대행사명을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="taxable"
                    id="edit-taxable"
                    defaultChecked={editingProduct.taxable}
                    className="w-4 h-4 text-rose-400 border-gray-300 rounded focus:ring-rose-300"
                  />
                  <label htmlFor="edit-taxable" className="text-sm font-medium text-gray-700">
                    과세 상품 (주민등록번호 입력 필요)
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-400 text-white rounded-md hover:bg-rose-500"
                >
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

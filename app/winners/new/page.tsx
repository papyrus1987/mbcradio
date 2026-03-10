'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Product } from '@/lib/supabase';

type SelectedProduct = {
  id: string;
  productId: string;
};

export default function NewWinnerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [addressMode, setAddressMode] = useState<'direct' | 'link'>('link');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([
    { id: crypto.randomUUID(), productId: '' }
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .gt('stock', 0)
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
  }

  function addProduct() {
    setSelectedProducts([
      ...selectedProducts,
      { id: crypto.randomUUID(), productId: '' }
    ]);
  }

  function removeProduct(id: string) {
    if (selectedProducts.length > 1) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== id));
    }
  }

  function updateProduct(id: string, productId: string) {
    setSelectedProducts(selectedProducts.map(p =>
      p.id === id ? { ...p, productId } : p
    ));
  }

  function getProductById(productId: string) {
    return products.find(p => p.id === productId);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // 선택된 상품 필터링
    const validProducts = selectedProducts.filter(p => p.productId);
    if (validProducts.length === 0) {
      alert('최소 1개 이상의 상품을 선택해주세요.');
      setLoading(false);
      return;
    }

    // 고유번호 생성 (날짜 + 랜덤 4자리)
    const today = new Date();
    const dateStr = `${today.getFullYear().toString().slice(-2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const uniqueCode = `${dateStr}-${randomNum}`;

    const winner = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      address: addressMode === 'direct' ? formData.get('address') as string : null,
      address_submitted: addressMode === 'direct',
      broadcast_date: formData.get('broadcast_date') as string,
      unique_code: uniqueCode,
    };

    // 1. 당첨자 등록
    const { data: winnerData, error: winnerError } = await supabase
      .from('winners')
      .insert([winner])
      .select()
      .single();

    if (winnerError || !winnerData) {
      console.error('Error creating winner:', winnerError);
      alert('당첨자 추가에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 2. 당첨자-상품 연결 등록
    const winnerProducts = validProducts.map(p => ({
      winner_id: winnerData.id,
      product_id: p.productId,
    }));

    const { error: wpError } = await supabase
      .from('winner_products')
      .insert(winnerProducts);

    if (wpError) {
      console.error('Error creating winner products:', wpError);
      alert('상품 연결에 실패했습니다.');
      setLoading(false);
      return;
    }

    router.push('/winners');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/winners"
          className="text-gray-500 hover:text-gray-700"
        >
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">당첨자 추가</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="당첨자 이름"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="010-0000-0000"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              방송일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="broadcast_date"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
            />
          </div>

          {/* 상품 선택 (여러 개) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              당첨 상품 <span className="text-red-500">*</span>
            </label>

            <div className="space-y-3">
              {selectedProducts.map((sp, index) => {
                const selectedProduct = getProductById(sp.productId);
                return (
                  <div key={sp.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-600">상품 {index + 1}</span>
                      {selectedProducts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(sp.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <select
                      value={sp.productId}
                      onChange={(e) => updateProduct(sp.id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
                    >
                      <option value="">상품 선택</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (재고: {product.stock}개)
                        </option>
                      ))}
                    </select>
                    {selectedProduct?.agency && (
                      <div className="mt-2 text-sm text-rose-500">
                        대행사: {selectedProduct.agency}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addProduct}
              className="mt-3 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-rose-300 hover:text-rose-500 transition-colors"
            >
              + 상품 추가
            </button>

            {products.length === 0 && (
              <p className="mt-2 text-sm text-red-500">
                재고가 있는 상품이 없습니다. 먼저 상품을 추가해주세요.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주소 입력 방식
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="addressMode"
                  value="link"
                  checked={addressMode === 'link'}
                  onChange={() => setAddressMode('link')}
                  className="mr-2"
                />
                링크 발송 (당첨자가 직접 입력)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="addressMode"
                  value="direct"
                  checked={addressMode === 'direct'}
                  onChange={() => setAddressMode('direct')}
                  className="mr-2"
                />
                직접 입력
              </label>
            </div>
          </div>

          {addressMode === 'direct' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배송 주소 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                required={addressMode === 'direct'}
                rows={3}
                placeholder="배송받으실 주소를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
              />
            </div>
          )}

          {addressMode === 'link' && (
            <div className="bg-rose-50 p-4 rounded-md">
              <p className="text-sm text-rose-500">
                당첨자 추가 후 목록에서 &quot;링크복사&quot; 버튼을 클릭하여 주소 입력 링크를 당첨자에게 전달하세요.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <Link
            href="/winners"
            className="flex-1 px-4 py-2 text-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading || products.length === 0}
            className="flex-1 px-4 py-2 bg-rose-400 text-white rounded-md hover:bg-rose-500 disabled:bg-rose-300 transition-colors"
          >
            {loading ? '저장 중...' : '당첨자 추가'}
          </button>
        </div>
      </form>
    </div>
  );
}

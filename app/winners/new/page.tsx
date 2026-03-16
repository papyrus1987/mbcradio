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

    const validProducts = selectedProducts.filter(p => p.productId);
    if (validProducts.length === 0) {
      alert('최소 1개 이상의 상품을 선택해주세요.');
      setLoading(false);
      return;
    }

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
      form_token: crypto.randomUUID(),
    };

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
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/winners"
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">당첨자 추가</h1>
          <p className="text-sm text-gray-500 mt-0.5">새로운 당첨자 정보를 입력합니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <div className="space-y-6">
          {/* 이름 */}
          <div>
            <label className="input-label">
              이름 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="당첨자 이름"
              className="input"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="input-label">
              전화번호 <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="010-0000-0000"
              className="input"
            />
          </div>

          {/* 방송일자 */}
          <div>
            <label className="input-label">
              방송일자 <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              name="broadcast_date"
              required
              className="input"
            />
          </div>

          {/* 상품 선택 */}
          <div>
            <label className="input-label">
              당첨 상품 <span className="text-danger">*</span>
            </label>

            <div className="space-y-3">
              {selectedProducts.map((sp, index) => {
                const selectedProduct = getProductById(sp.productId);
                return (
                  <div key={sp.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-600">상품 {index + 1}</span>
                      {selectedProducts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(sp.id)}
                          className="text-danger hover:text-danger-dark text-sm font-medium transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <select
                      value={sp.productId}
                      onChange={(e) => updateProduct(sp.id, e.target.value)}
                      className="input"
                    >
                      <option value="">상품 선택</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (재고: {product.stock}개)
                        </option>
                      ))}
                    </select>
                    {selectedProduct?.agency && (
                      <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-secondary/10 flex items-center justify-center text-xs">🏢</span>
                        {selectedProduct.agency}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addProduct}
              className="mt-3 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors font-medium"
            >
              + 상품 추가
            </button>

            {products.length === 0 && (
              <p className="mt-3 text-sm text-danger flex items-center gap-2">
                <span>⚠️</span>
                재고가 있는 상품이 없습니다. 먼저 상품을 추가해주세요.
              </p>
            )}
          </div>

          {/* 주소 입력 방식 */}
          <div>
            <label className="input-label">주소 입력 방식</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="addressMode"
                  value="link"
                  checked={addressMode === 'link'}
                  onChange={() => setAddressMode('link')}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">링크 발송</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="addressMode"
                  value="direct"
                  checked={addressMode === 'direct'}
                  onChange={() => setAddressMode('direct')}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">직접 입력</span>
              </label>
            </div>
          </div>

          {addressMode === 'direct' ? (
            <div>
              <label className="input-label">
                배송 주소 <span className="text-danger">*</span>
              </label>
              <textarea
                name="address"
                required={addressMode === 'direct'}
                rows={3}
                placeholder="배송받으실 주소를 입력하세요"
                className="input resize-none"
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-secondary/30"
                 style={{ background: 'rgba(255, 140, 66, 0.05)' }}>
              <p className="text-sm text-secondary-dark flex items-start gap-2">
                <span className="text-lg">💡</span>
                <span>당첨자 추가 후 목록에서 &quot;링크복사&quot; 버튼을 클릭하여 주소 입력 링크를 당첨자에게 전달하세요.</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <Link href="/winners" className="flex-1 btn-secondary text-center">
            취소
          </Link>
          <button
            type="submit"
            disabled={loading || products.length === 0}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                저장 중...
              </>
            ) : (
              '당첨자 추가'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

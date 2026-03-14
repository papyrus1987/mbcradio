'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(0);

  const isAutoTaxable = price > 50000;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const product = {
      name: formData.get('name') as string,
      stock: parseInt(formData.get('stock') as string) || 0,
      agency: formData.get('agency') as string || null,
      price: parseInt(formData.get('price') as string) || 0,
      taxable: isAutoTaxable || formData.get('taxable') === 'on',
    };

    const { error } = await supabase.from('products').insert([product]);

    if (error) {
      console.error('Error creating product:', error);
      alert('상품 추가에 실패했습니다.');
      setLoading(false);
    } else {
      router.push('/products');
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/products"
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">상품 추가</h1>
          <p className="text-sm text-gray-500 mt-0.5">새로운 상품 정보를 입력합니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <div className="space-y-6">
          {/* 상품명 */}
          <div>
            <label className="input-label">
              상품명 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="상품명을 입력하세요"
              className="input"
            />
          </div>

          {/* 가격 */}
          <div>
            <label className="input-label">
              가격 (원) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="price"
              min="0"
              defaultValue="0"
              required
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              className="input"
            />
            {isAutoTaxable && (
              <p className="mt-2 text-sm text-warning flex items-center gap-2">
                <span>⚠️</span>
                5만원 초과 상품은 자동으로 과세 상품으로 분류됩니다.
              </p>
            )}
          </div>

          {/* 재고 수량 */}
          <div>
            <label className="input-label">
              재고 수량 <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="stock"
              min="0"
              defaultValue="0"
              required
              className="input"
            />
          </div>

          {/* 대행사 */}
          <div>
            <label className="input-label">대행사</label>
            <input
              type="text"
              name="agency"
              placeholder="대행사명을 입력하세요"
              className="input"
            />
          </div>

          {/* 과세 여부 */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              name="taxable"
              id="taxable"
              disabled={isAutoTaxable}
              checked={isAutoTaxable ? true : undefined}
              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary disabled:bg-gray-200"
            />
            <label htmlFor="taxable" className="text-sm font-medium text-gray-700">
              과세 상품 (주민등록번호 입력 필요)
              {isAutoTaxable && <span className="text-warning ml-2">(자동 선택됨)</span>}
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Link href="/products" className="flex-1 btn-secondary text-center">
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                저장 중...
              </>
            ) : (
              '상품 추가'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const product = {
      name: formData.get('name') as string,
      stock: parseInt(formData.get('stock') as string) || 0,
      agency: formData.get('agency') as string || null,
      taxable: formData.get('taxable') === 'on',
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/products"
          className="text-gray-500 hover:text-gray-700"
        >
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">상품 추가</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상품명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="상품명을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              재고 수량 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="stock"
              min="0"
              defaultValue="0"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              대행사
            </label>
            <input
              type="text"
              name="agency"
              placeholder="대행사명을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="taxable"
              id="taxable"
              className="w-4 h-4 text-rose-400 border-gray-300 rounded focus:ring-rose-300"
            />
            <label htmlFor="taxable" className="text-sm font-medium text-gray-700">
              과세 상품 (주민등록번호 입력 필요)
            </label>
          </div>

        </div>

        <div className="flex gap-3 mt-8">
          <Link
            href="/products"
            className="flex-1 px-4 py-2 text-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-rose-400 text-white rounded-md hover:bg-rose-500 disabled:bg-rose-300 transition-colors"
          >
            {loading ? '저장 중...' : '상품 추가'}
          </button>
        </div>
      </form>
    </div>
  );
}

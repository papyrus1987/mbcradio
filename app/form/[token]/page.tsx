'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, Winner } from '@/lib/supabase';

export default function AddressFormPage() {
  const params = useParams();
  const token = params.token as string;

  const [winner, setWinner] = useState<Winner | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 과세 상품 여부 확인
  const hasTaxableProduct = winner?.winner_products?.some(
    (wp) => wp.product?.taxable
  ) ?? false;

  useEffect(() => {
    fetchWinner();
  }, [token]);

  async function fetchWinner() {
    setLoading(true);
    const { data, error } = await supabase
      .from('winners')
      .select(`
        *,
        winner_products (
          id,
          product_id,
          product:products (*)
        )
      `)
      .eq('form_token', token)
      .single();

    if (error || !data) {
      setError('유효하지 않은 링크입니다.');
    } else if (data.address_submitted) {
      setSubmitted(true);
      setWinner(data);
    } else {
      setWinner(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!winner) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const address = formData.get('address') as string;
    const residentId = formData.get('resident_id') as string | null;

    // 과세 상품인데 주민번호가 없으면 에러
    if (hasTaxableProduct && !residentId) {
      alert('과세 상품 수령을 위해 주민등록번호를 입력해주세요.');
      setSubmitting(false);
      return;
    }

    // 주민등록번호 형식 검증 (13자리)
    if (residentId) {
      const cleanResidentId = residentId.replace(/-/g, '');
      if (cleanResidentId.length !== 13) {
        alert('올바른 주민등록번호 형식이 아닙니다. (예: 000000-0000000)');
        setSubmitting(false);
        return;
      }
    }

    const updateData: Record<string, unknown> = {
      address,
      address_submitted: true,
    };

    if (residentId) {
      updateData.resident_id = residentId.replace(/-/g, '');
    }

    const { error } = await supabase
      .from('winners')
      .update(updateData)
      .eq('id', winner.id);

    if (error) {
      console.error('Error updating address:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
      setSubmitting(false);
    } else {
      setSubmitted(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">오류</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">주소가 저장되었습니다</h1>
          <p className="text-gray-600 mb-4">
            {winner?.name}님, 배송 주소가 정상적으로 등록되었습니다.
          </p>
          <p className="text-sm text-gray-500">
            상품이 곧 발송될 예정입니다. 감사합니다!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-rose-400 text-sm font-medium mb-1">MBC라디오 여성시대</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            축하합니다! 🎉
          </h1>
          <p className="text-gray-600">
            <span className="font-semibold">{winner?.name}</span>님,
            여성시대 이벤트에 당첨되셨습니다!
          </p>
        </div>

        {winner?.unique_code && (
          <div className="bg-gray-100 p-3 rounded-md mb-4 text-center">
            <p className="text-xs text-gray-500 mb-1">고유번호</p>
            <p className="text-lg font-bold text-gray-800">{winner.unique_code}</p>
          </div>
        )}

        {winner?.winner_products && winner.winner_products.length > 0 && (
          <div className="bg-rose-50 p-4 rounded-md mb-6">
            <p className="text-sm text-rose-500 font-medium mb-2">당첨 상품</p>
            <div className="space-y-1">
              {winner.winner_products.map((wp, index) => (
                <div key={wp.id} className="flex items-center gap-2">
                  <p className="text-lg font-bold text-rose-600">
                    {index + 1}. {wp.product?.name}
                  </p>
                  {wp.product?.taxable && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      과세
                    </span>
                  )}
                </div>
              ))}
            </div>
            {hasTaxableProduct && (
              <p className="text-xs text-yellow-600 mt-3">
                * 과세 상품이 포함되어 있어 기타소득 신고를 위한 주민등록번호 입력이 필요합니다.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {hasTaxableProduct && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주민등록번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="resident_id"
                required
                placeholder="000000-0000000"
                maxLength={14}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
              />
              <p className="mt-2 text-xs text-gray-500">
                과세 상품 수령 시 기타소득 신고를 위해 필요합니다. 입력하신 정보는 안전하게 보호됩니다.
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              배송받으실 주소를 입력해주세요 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              required
              rows={4}
              placeholder="예) 서울시 강남구 테헤란로 123, 456호"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-300 focus:border-rose-300"
            />
            <p className="mt-2 text-xs text-gray-500">
              정확한 주소를 입력해주세요. 잘못된 주소로 인한 배송 문제는 책임지지 않습니다.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 bg-rose-400 text-white rounded-md hover:bg-rose-500 disabled:bg-rose-300 font-medium transition-colors"
          >
            {submitting ? '저장 중...' : '주소 제출하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

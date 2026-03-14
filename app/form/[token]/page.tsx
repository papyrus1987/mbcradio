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

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const hasTaxableProduct = winner?.winner_products?.some(
    (wp) => wp.product?.taxable
  ) ?? false;

  useEffect(() => {
    if (winner?.phone_verified) {
      setOtpVerified(true);
    }
  }, [winner]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  async function handleSendOtp() {
    if (!winner) return;

    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: winner.phone,
          winnerId: winner.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpSent(true);
        setCountdown(180);
      } else {
        setOtpError(result.error || '인증번호 발송에 실패했습니다.');
      }
    } catch {
      setOtpError('서버 오류가 발생했습니다.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!winner || !otpCode) return;

    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: winner.id,
          code: otpCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpVerified(true);
      } else {
        setOtpError(result.error || '인증에 실패했습니다.');
      }
    } catch {
      setOtpError('서버 오류가 발생했습니다.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!winner) return;

    if (hasTaxableProduct && !otpVerified) {
      alert('본인인증을 먼저 완료해주세요.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const address = formData.get('address') as string;
    const residentId = formData.get('resident_id') as string | null;

    if (hasTaxableProduct && !residentId) {
      alert('과세 상품 수령을 위해 주민등록번호를 입력해주세요.');
      setSubmitting(false);
      return;
    }

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <span className="spinner w-8 h-8 text-primary mx-auto block mb-4"></span>
          <p className="text-gray-500 font-medium">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="form-card text-center">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
               style={{ background: 'rgba(239, 71, 111, 0.1)' }}>
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="form-card form-success">
          <div className="form-success-icon">
            <span className="text-5xl text-white">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">주소가 저장되었습니다!</h1>
          <p className="text-gray-500 mb-6">
            {winner?.name}님, 배송 주소가 정상적으로 등록되었습니다.<br />
            상품이 곧 발송될 예정입니다. 감사합니다!
          </p>
          {winner?.winner_products && winner.winner_products.length > 0 && (
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-left">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">당첨 상품:</span>{' '}
                {winner.winner_products.map(wp => wp.product?.name).filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="form-card animate-fade-in">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
               style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.1) 0%, rgba(255,140,66,0.1) 100%)' }}>
            <span className="text-3xl">🎁</span>
          </div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">MBC라디오 여성시대</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">축하합니다!</h1>
          <p className="text-gray-500">
            <span className="font-semibold text-primary">{winner?.name}</span>님, 이벤트에 당첨되셨습니다!
          </p>
        </div>

        {/* 고유번호 */}
        {winner?.unique_code && (
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-center mb-6">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">고유번호</p>
            <p className="text-xl font-bold text-gray-900 font-mono tracking-wider">{winner.unique_code}</p>
          </div>
        )}

        {/* 당첨 상품 */}
        {winner?.winner_products && winner.winner_products.length > 0 && (
          <div className="p-4 rounded-xl border border-primary/20 mb-6"
               style={{ background: 'rgba(230, 57, 70, 0.03)' }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">당첨 상품</p>
            <div className="space-y-2">
              {winner.winner_products.map((wp, index) => (
                <div key={wp.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-gray-900">{wp.product?.name}</span>
                  {wp.product?.taxable && (
                    <span className="badge badge-warning text-xs">과세</span>
                  )}
                </div>
              ))}
            </div>
            {hasTaxableProduct && (
              <p className="text-xs text-warning-dark mt-4 flex items-start gap-2">
                <span>⚠️</span>
                <span>과세 상품이 포함되어 있어 본인인증 및 주민등록번호 입력이 필요합니다.</span>
              </p>
            )}
          </div>
        )}

        {/* 본인인증 섹션 */}
        {hasTaxableProduct && !otpVerified && (
          <div className="p-5 rounded-xl border border-warning/30 mb-6 animate-slide-up"
               style={{ background: 'rgba(252, 163, 17, 0.05)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(252, 163, 17, 0.15)' }}>
                <span className="text-xl">🔐</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">본인인증</h3>
                <p className="text-xs text-gray-500">등록된 번호: {winner?.phone}</p>
              </div>
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading}
                className="w-full btn-warm disabled:opacity-50"
              >
                {otpLoading ? (
                  <>
                    <span className="spinner"></span>
                    발송 중...
                  </>
                ) : (
                  '인증번호 받기'
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="인증번호 6자리"
                    maxLength={6}
                    className="input flex-1 text-center text-xl tracking-widest font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    className="btn-success disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <span className="spinner w-4 h-4"></span>
                    ) : (
                      '확인'
                    )}
                  </button>
                </div>
                {countdown > 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    남은 시간: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </p>
                )}
                {countdown === 0 && otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="text-sm text-warning-dark hover:text-warning underline w-full text-center"
                  >
                    인증번호 재발송
                  </button>
                )}
              </div>
            )}

            {otpError && (
              <p className="text-xs text-danger mt-3 flex items-center gap-2">
                <span>⚠️</span>
                {otpError}
              </p>
            )}
          </div>
        )}

        {/* 인증 완료 표시 */}
        {hasTaxableProduct && otpVerified && (
          <div className="p-4 rounded-xl border border-success/30 mb-6"
               style={{ background: 'rgba(6, 214, 160, 0.05)' }}>
            <p className="text-sm text-success-dark flex items-center gap-2 font-semibold">
              <span className="w-5 h-5 rounded-full bg-success flex items-center justify-center text-white text-xs">✓</span>
              본인인증이 완료되었습니다.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 주민번호 입력 */}
          {hasTaxableProduct && otpVerified && (
            <div className="animate-slide-up">
              <label className="input-label">
                주민등록번호 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="resident_id"
                required
                placeholder="000000-0000000"
                maxLength={14}
                className="input font-mono tracking-wide"
              />
              <p className="mt-2 text-xs text-gray-500 flex items-start gap-2">
                <span>🔒</span>
                <span>과세 상품 수령 시 기타소득 신고를 위해 필요합니다. 입력하신 정보는 안전하게 보호됩니다.</span>
              </p>
            </div>
          )}

          {/* 주소 입력 */}
          <div>
            <label className="input-label">
              배송 주소 <span className="text-danger">*</span>
            </label>
            <textarea
              name="address"
              required
              rows={3}
              placeholder="예) 서울시 강남구 테헤란로 123, 456호"
              className="input resize-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              정확한 주소를 입력해주세요. 잘못된 주소로 인한 배송 문제는 책임지지 않습니다.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || (hasTaxableProduct && !otpVerified)}
            className="w-full btn-primary py-3.5 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="spinner"></span>
                저장 중...
              </>
            ) : (
              '주소 제출하기'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

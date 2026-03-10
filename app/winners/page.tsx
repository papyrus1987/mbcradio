'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Winner } from '@/lib/supabase';
import WinnerTable from '@/components/WinnerTable';

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '대기' | '발송완료'>('all');
  const [sendingKakaoId, setSendingKakaoId] = useState<string | null>(null);

  useEffect(() => {
    fetchWinners();
  }, []);

  async function fetchWinners() {
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching winners:', error);
    } else {
      setWinners(data || []);
    }
    setLoading(false);
  }

  async function handleStatusChange(id: string, newStatus: '대기' | '발송완료') {
    const winner = winners.find(w => w.id === id);
    if (!winner) return;

    const winnerProducts = winner.winner_products || [];

    // 발송완료로 변경 시 재고 차감
    if (newStatus === '발송완료') {
      for (const wp of winnerProducts) {
        if (wp.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', wp.product_id)
            .single();

          if (product && product.stock > 0) {
            await supabase
              .from('products')
              .update({ stock: product.stock - 1 })
              .eq('id', wp.product_id);
          } else if (product && product.stock <= 0) {
            alert(`재고가 부족합니다: ${wp.product?.name}`);
            return;
          }
        }
      }
    }

    // 대기로 변경 시 재고 복구
    if (newStatus === '대기' && winner.status === '발송완료') {
      for (const wp of winnerProducts) {
        if (wp.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', wp.product_id)
            .single();

          if (product) {
            await supabase
              .from('products')
              .update({ stock: product.stock + 1 })
              .eq('id', wp.product_id);
          }
        }
      }
    }

    const { error } = await supabase
      .from('winners')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      alert('상태 변경에 실패했습니다.');
    } else {
      setWinners(winners.map(w => w.id === id ? { ...w, status: newStatus } : w));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 이 당첨자를 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('winners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting winner:', error);
      alert('삭제에 실패했습니다.');
    } else {
      setWinners(winners.filter(w => w.id !== id));
    }
  }

  function handleCopyLink(token: string) {
    const url = `${window.location.origin}/form/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('주소 입력 링크가 복사되었습니다!');
    }).catch(() => {
      prompt('아래 링크를 복사하세요:', url);
    });
  }

  async function handleSendKakao(winner: Winner) {
    if (!confirm(`${winner.name}님에게 카카오톡 알림톡을 발송하시겠습니까?`)) return;

    setSendingKakaoId(winner.id);

    const formUrl = `${window.location.origin}/form/${winner.form_token}`;
    const productNames = winner.winner_products
      ?.map(wp => wp.product?.name)
      .filter(Boolean)
      .join(', ') || '상품';
    const hasTaxable = winner.winner_products?.some(wp => wp.product?.taxable) || false;

    try {
      const response = await fetch('/api/send-kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: winner.phone,
          name: winner.name,
          formUrl,
          productNames,
          uniqueCode: winner.unique_code,
          hasTaxable,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
      } else {
        alert(`발송 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending KakaoTalk:', error);
      alert('발송 중 오류가 발생했습니다.');
    } finally {
      setSendingKakaoId(null);
    }
  }

  const filteredWinners = filter === 'all'
    ? winners
    : winners.filter(w => w.status === filter);

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
        <h1 className="text-2xl font-bold text-gray-900">당첨자 관리</h1>
        <Link
          href="/winners/new"
          className="px-4 py-2 bg-rose-400 text-white rounded-md hover:bg-rose-500 transition-colors"
        >
          당첨자 추가
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-rose-400 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          전체 ({winners.length})
        </button>
        <button
          onClick={() => setFilter('대기')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === '대기'
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          대기 ({winners.filter(w => w.status === '대기').length})
        </button>
        <button
          onClick={() => setFilter('발송완료')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === '발송완료'
              ? 'bg-green-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          발송완료 ({winners.filter(w => w.status === '발송완료').length})
        </button>
      </div>

      {filteredWinners.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">당첨자가 없습니다.</p>
          <Link
            href="/winners/new"
            className="mt-4 inline-block text-rose-400 hover:text-rose-500"
          >
            첫 당첨자를 추가해보세요
          </Link>
        </div>
      ) : (
        <WinnerTable
          winners={filteredWinners}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onCopyLink={handleCopyLink}
          onSendKakao={handleSendKakao}
          sendingKakaoId={sendingKakaoId}
        />
      )}
    </div>
  );
}

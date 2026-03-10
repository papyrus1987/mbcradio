'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Product, Winner } from '@/lib/supabase';
import StockBadge from '@/components/StockBadge';

type DashboardStats = {
  totalWinners: number;
  pendingCount: number;
  completedCount: number;
  addressPendingCount: number;
  products: Product[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);

    const [winnersResult, productsResult] = await Promise.all([
      supabase.from('winners').select('*'),
      supabase.from('products').select('*').order('stock', { ascending: true }),
    ]);

    if (winnersResult.error || productsResult.error) {
      console.error('Error fetching stats');
      setLoading(false);
      return;
    }

    const winners = winnersResult.data || [];
    const products = productsResult.data || [];

    setStats({
      totalWinners: winners.length,
      pendingCount: winners.filter((w: Winner) => w.status === '대기').length,
      completedCount: winners.filter((w: Winner) => w.status === '발송완료').length,
      addressPendingCount: winners.filter((w: Winner) => !w.address_submitted).length,
      products,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">데이터를 불러오는데 실패했습니다.</p>
        <p className="text-sm text-gray-400 mt-2">Supabase 연결 설정을 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 배너 */}
      <div className="bg-gradient-to-r from-rose-300 to-rose-400 rounded-2xl p-8 mb-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <span className="text-5xl">📻</span>
          <div>
            <h1 className="text-3xl font-bold">MBC라디오 여성시대</h1>
            <p className="text-rose-100 text-lg mt-1">상품 발송 관리 시스템</p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-300">
          <div className="text-sm font-medium text-gray-500 mb-1">총 당첨자</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalWinners}</div>
          <Link href="/winners" className="text-sm text-rose-400 hover:text-rose-500 mt-2 inline-block">
            상세보기 →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-400">
          <div className="text-sm font-medium text-gray-500 mb-1">발송 대기</div>
          <div className="text-3xl font-bold text-amber-500">{stats.pendingCount}</div>
          <Link href="/winners" className="text-sm text-rose-400 hover:text-rose-500 mt-2 inline-block">
            처리하기 →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
          <div className="text-sm font-medium text-gray-500 mb-1">발송 완료</div>
          <div className="text-3xl font-bold text-emerald-500">{stats.completedCount}</div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-400">
          <div className="text-sm font-medium text-gray-500 mb-1">주소 미입력</div>
          <div className="text-3xl font-bold text-red-500">{stats.addressPendingCount}</div>
          {stats.addressPendingCount > 0 && (
            <span className="text-sm text-red-500 mt-2 inline-block">확인 필요</span>
          )}
        </div>
      </div>

      {/* 상품 재고 현황 */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">상품 재고 현황</h2>
          <Link
            href="/products"
            className="text-sm text-rose-400 hover:text-rose-500"
          >
            전체보기 →
          </Link>
        </div>
        {stats.products.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            등록된 상품이 없습니다.
            <Link
              href="/products/new"
              className="block mt-2 text-indigo-600 hover:text-indigo-800"
            >
              상품 추가하기
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {stats.products.map((product) => (
              <div key={product.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                </div>
                <StockBadge stock={product.stock} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 빠른 작업 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/winners/new"
          className="bg-gradient-to-r from-rose-300 to-rose-400 text-white rounded-xl p-6 hover:from-rose-400 hover:to-rose-500 transition-all shadow-md"
        >
          <div className="text-lg font-semibold">+ 당첨자 추가</div>
          <div className="text-sm text-rose-100 mt-1">새로운 당첨자를 등록합니다</div>
        </Link>
        <Link
          href="/products/new"
          className="bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-xl p-6 hover:from-gray-800 hover:to-gray-700 transition-all shadow-md"
        >
          <div className="text-lg font-semibold">+ 상품 추가</div>
          <div className="text-sm text-gray-300 mt-1">새로운 상품을 등록합니다</div>
        </Link>
      </div>
    </div>
  );
}

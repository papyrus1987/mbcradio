import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

type DashboardStats = {
  totalWinners: number;
  pendingCount: number;
  completedCount: number;
  addressPendingCount: number;
};

async function getStats(): Promise<DashboardStats | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [totalResult, pendingResult, completedResult, addressPendingResult] = await Promise.all([
    supabase.from('winners').select('*', { count: 'exact', head: true }),
    supabase.from('winners').select('*', { count: 'exact', head: true }).eq('status', '대기'),
    supabase.from('winners').select('*', { count: 'exact', head: true }).eq('status', '발송완료'),
    supabase.from('winners').select('*', { count: 'exact', head: true }).eq('address_submitted', false),
  ]);

  if (totalResult.error) {
    console.error('Error fetching stats:', totalResult.error);
    return null;
  }

  return {
    totalWinners: totalResult.count || 0,
    pendingCount: pendingResult.count || 0,
    completedCount: completedResult.count || 0,
    addressPendingCount: addressPendingResult.count || 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <span className="text-3xl">⚠️</span>
        </div>
        <p className="text-gray-600 font-semibold text-lg">데이터를 불러오는데 실패했습니다</p>
        <p className="text-sm text-gray-400 mt-2">Supabase 연결 설정을 확인해주세요</p>
      </div>
    );
  }

  const completionRate = stats.totalWinners > 0
    ? Math.round((stats.completedCount / stats.totalWinners) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 히어로 섹션 */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-white"
        style={{ background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #8b5cf6 100%)' }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              ON AIR
            </span>
            <span className="px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-sm font-medium">
              MBC 표준FM 95.9MHz
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
            여성시대
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-xl">
            청취자 당첨 상품 발송을 한 곳에서 관리하세요
          </p>

          {/* 진행률 바 */}
          <div className="mt-10 max-w-md">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 text-sm font-medium">발송 진행률</span>
              <span className="text-2xl font-bold">{completionRate}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${completionRate}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>{stats.completedCount}건 완료</span>
              <span>{stats.pendingCount}건 대기</span>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* 총 당첨자 */}
        <div className="stat-card group animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                 style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)' }}>
              👥
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 mb-1">{stats.totalWinners}</p>
          <p className="text-sm text-gray-500 font-medium">총 당첨자</p>
          <Link
            href="/winners"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors group-hover:gap-3"
          >
            상세보기
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 발송 대기 */}
        <div className="stat-card group animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                 style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.1) 100%)' }}>
              ⏳
            </div>
            <span className="text-xs font-semibold text-warning-dark uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-4xl font-extrabold text-warning mb-1">{stats.pendingCount}</p>
          <p className="text-sm text-gray-500 font-medium">발송 대기</p>
          <Link
            href="/winners?filter=대기"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-warning-dark hover:text-warning transition-colors group-hover:gap-3"
          >
            처리하기
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 발송 완료 */}
        <div className="stat-card group animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                 style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(52,211,153,0.1) 100%)' }}>
              ✅
            </div>
            <span className="text-xs font-semibold text-success-dark uppercase tracking-wider">Done</span>
          </div>
          <p className="text-4xl font-extrabold text-success mb-1">{stats.completedCount}</p>
          <p className="text-sm text-gray-500 font-medium">발송 완료</p>
          <div className="mt-4 text-sm text-gray-400 font-medium">
            전체의 {completionRate}% 완료
          </div>
        </div>

        {/* 주소 미입력 */}
        <div className="stat-card group animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #ef4444, #f87171)' }} />
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                 style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(248,113,113,0.1) 100%)' }}>
              📝
            </div>
            <span className="text-xs font-semibold text-danger-dark uppercase tracking-wider">Alert</span>
          </div>
          <p className="text-4xl font-extrabold text-danger mb-1">{stats.addressPendingCount}</p>
          <p className="text-sm text-gray-500 font-medium">주소 미입력</p>
          {stats.addressPendingCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-danger">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
              </span>
              확인 필요
            </div>
          )}
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link href="/winners/new" className="action-card action-card-primary group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-3xl">🏆</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">당첨자 추가</h3>
              <p className="text-white/70 text-sm">새로운 당첨자를 등록합니다</p>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link href="/products/new" className="action-card action-card-dark group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-3xl">🎁</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">상품 추가</h3>
              <p className="text-white/60 text-sm">새로운 상품을 등록합니다</p>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}

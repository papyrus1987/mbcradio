import { createClient } from '@supabase/supabase-js';
import { Winner } from '@/lib/supabase';
import WinnersClient from './WinnersClient';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

type SearchParams = Promise<{ filter?: string; page?: string }>;

async function getWinnersData(filter: 'all' | '대기' | '발송완료' | '미입력', page: number) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const offset = (page - 1) * PAGE_SIZE;

  // 필터 카운트를 병렬로 가져오기
  const [allCountResult, pendingCountResult, completedCountResult, addressPendingResult] = await Promise.all([
    supabase.from('winners').select('*', { count: 'exact', head: true }),
    supabase.from('winners').select('*', { count: 'exact', head: true }).eq('status', '대기'),
    supabase.from('winners').select('*', { count: 'exact', head: true }).eq('status', '발송완료'),
    supabase.from('winners').select('*', { count: 'exact', head: true }).eq('address_submitted', false),
  ]);

  // 현재 필터에 맞는 데이터 가져오기 (페이지네이션 적용)
  let query = supabase
    .from('winners')
    .select(`
      *,
      winner_products (
        id,
        product_id,
        product:products (*)
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filter === '미입력') {
    query = query.eq('address_submitted', false);
  } else if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: winners, error } = await query;

  if (error) {
    console.error('Error fetching winners:', error);
    return null;
  }

  // 현재 필터의 총 개수
  let totalCount = allCountResult.count || 0;
  if (filter === '대기') {
    totalCount = pendingCountResult.count || 0;
  } else if (filter === '발송완료') {
    totalCount = completedCountResult.count || 0;
  } else if (filter === '미입력') {
    totalCount = addressPendingResult.count || 0;
  }

  return {
    winners: (winners || []) as Winner[],
    totalCount,
    filterCounts: {
      all: allCountResult.count || 0,
      pending: pendingCountResult.count || 0,
      completed: completedCountResult.count || 0,
      addressPending: addressPendingResult.count || 0,
    },
  };
}

export default async function WinnersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filter = (params.filter as 'all' | '대기' | '발송완료' | '미입력') || 'all';
  const page = parseInt(params.page || '1', 10);

  const data = await getWinnersData(filter, page);

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">데이터를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <WinnersClient
      initialWinners={data.winners}
      totalCount={data.totalCount}
      initialPage={page}
      pageSize={PAGE_SIZE}
      initialFilter={filter}
      filterCounts={data.filterCounts}
    />
  );
}

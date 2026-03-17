'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, Winner } from '@/lib/supabase';

type Props = {
  initialWinners: Winner[];
  totalCount: number;
  initialPage: number;
  pageSize: number;
  initialFilter: 'all' | '대기' | '발송완료' | '미입력';
  filterCounts: {
    all: number;
    pending: number;
    completed: number;
    addressPending: number;
  };
};

export default function WinnersClient({
  initialWinners,
  totalCount,
  initialPage,
  pageSize,
  initialFilter,
  filterCounts,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [winners, setWinners] = useState<Winner[]>(initialWinners);
  const [sendingKakaoId, setSendingKakaoId] = useState<string | null>(null);
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  function handleFilterChange(newFilter: 'all' | '대기' | '발송완료' | '미입력') {
    startTransition(() => {
      router.push(`/winners?filter=${newFilter}&page=1`);
    });
  }

  function handlePageChange(newPage: number) {
    startTransition(() => {
      router.push(`/winners?filter=${initialFilter}&page=${newPage}`);
    });
  }

  async function handleStatusChange(id: string, newStatus: '대기' | '발송완료') {
    const winner = winners.find(w => w.id === id);
    if (!winner) return;

    const winnerProducts = winner.winner_products || [];

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
      router.refresh();
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
      router.refresh();
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

  async function handleSendSms(winner: Winner) {
    if (!confirm(`${winner.name}님에게 SMS 문자를 발송하시겠습니까?`)) return;

    setSendingSmsId(winner.id);

    const formUrl = `${window.location.origin}/form/${winner.form_token}`;
    const productNames = winner.winner_products
      ?.map(wp => wp.product?.name)
      .filter(Boolean)
      .join(', ') || '상품';
    const hasTaxable = winner.winner_products?.some(wp => wp.product?.taxable) || false;

    try {
      const response = await fetch('/api/send-sms', {
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
      console.error('Error sending SMS:', error);
      alert('발송 중 오류가 발생했습니다.');
    } finally {
      setSendingSmsId(null);
    }
  }

  async function handleExportExcel() {
    if (winners.length === 0) {
      alert('추출할 당첨자가 없습니다.');
      return;
    }

    setIsExporting(true);

    try {
      const XLSX = await import('xlsx');

      const excelData = winners.map((winner) => {
        const products = winner.winner_products?.map(wp => wp.product?.name).filter(Boolean).join(', ') || '';
        const hasTaxable = winner.winner_products?.some(wp => wp.product?.taxable) || false;

        const row: Record<string, string | null> = {
          '이름': winner.name,
          '전화번호': winner.phone,
          '고유번호': winner.unique_code,
          '상품': products,
          '주소': winner.address || '',
          '상태': winner.status,
          '방송일': winner.broadcast_date || '',
        };

        if (hasTaxable) {
          row['주민등록번호'] = winner.resident_id || '';
        } else {
          row['주민등록번호'] = '-';
        }

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      worksheet['!cols'] = [
        { wch: 10 },
        { wch: 15 },
        { wch: 12 },
        { wch: 30 },
        { wch: 40 },
        { wch: 10 },
        { wch: 12 },
        { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '당첨자 명단');

      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const filterLabel = initialFilter === 'all' ? '전체' : initialFilter;
      const fileName = `당첨자명단_${filterLabel}_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, fileName);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">당첨자 관리</h1>
          <p className="text-gray-500 mt-1">총 <span className="font-semibold text-primary">{totalCount}</span>명의 당첨자</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="btn-success disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <span className="spinner"></span>
                추출 중...
              </>
            ) : (
              <>
                <span>📥</span>
                엑셀 추출
              </>
            )}
          </button>
          <Link href="/winners/new" className="btn-primary">
            <span>+</span>
            당첨자 추가
          </Link>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="tab-group">
        <button
          onClick={() => handleFilterChange('all')}
          disabled={isPending}
          className={`tab ${initialFilter === 'all' ? 'tab-active' : ''}`}
        >
          전체 <span className="ml-1.5 opacity-70">{filterCounts.all}</span>
        </button>
        <button
          onClick={() => handleFilterChange('대기')}
          disabled={isPending}
          className={`tab ${initialFilter === '대기' ? 'tab-active' : ''}`}
          style={initialFilter === '대기' ? { background: 'linear-gradient(135deg, #fca311, #d97706)' } : {}}
        >
          대기 <span className="ml-1.5 opacity-70">{filterCounts.pending}</span>
        </button>
        <button
          onClick={() => handleFilterChange('발송완료')}
          disabled={isPending}
          className={`tab ${initialFilter === '발송완료' ? 'tab-active' : ''}`}
          style={initialFilter === '발송완료' ? { background: 'linear-gradient(135deg, #06d6a0, #059669)' } : {}}
        >
          완료 <span className="ml-1.5 opacity-70">{filterCounts.completed}</span>
        </button>
        <button
          onClick={() => handleFilterChange('미입력')}
          disabled={isPending}
          className={`tab ${initialFilter === '미입력' ? 'tab-active' : ''}`}
          style={initialFilter === '미입력' ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)' } : {}}
        >
          미입력 <span className="ml-1.5 opacity-70">{filterCounts.addressPending}</span>
        </button>
      </div>

      {isPending && (
        <div className="flex items-center gap-3 text-sm text-gray-500 py-2">
          <span className="spinner text-primary"></span>
          로딩 중...
        </div>
      )}

      {winners.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <span className="text-3xl">🏆</span>
          </div>
          <p className="text-gray-600 font-semibold text-lg">당첨자가 없습니다</p>
          <Link href="/winners/new" className="mt-4 btn-primary">
            첫 당첨자를 추가해보세요
          </Link>
        </div>
      ) : (
        <>
          {/* 테이블 */}
          <div className="table-container overflow-x-auto scrollbar-thin">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>연락처</th>
                  <th>상품</th>
                  <th>방송일</th>
                  <th className="text-center">주소</th>
                  <th className="text-center">상태</th>
                  <th className="text-center">액션</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((winner) => (
                  <tr key={winner.id}>
                    <td>
                      <span className="font-semibold text-gray-900">{winner.name}</span>
                    </td>
                    <td>
                      <span className="font-mono text-sm text-gray-600">{winner.phone}</span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {winner.winner_products?.map((wp) => (
                          <span key={wp.id} className="badge badge-info">
                            {wp.product?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-gray-500">{winner.broadcast_date || '-'}</td>
                    <td className="text-center">
                      {winner.address_submitted ? (
                        <span className="badge badge-success">입력완료</span>
                      ) : (
                        <span className="badge badge-warning">미입력</span>
                      )}
                    </td>
                    <td className="text-center">
                      <select
                        value={winner.status}
                        onChange={(e) => handleStatusChange(winner.id, e.target.value as '대기' | '발송완료')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-all"
                        style={{
                          background: winner.status === '발송완료'
                            ? 'rgba(6, 214, 160, 0.15)'
                            : 'rgba(252, 163, 17, 0.15)',
                          color: winner.status === '발송완료'
                            ? 'var(--success-dark)'
                            : 'var(--warning-dark)'
                        }}
                      >
                        <option value="대기">대기</option>
                        <option value="발송완료">발송완료</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCopyLink(winner.form_token)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                          title="링크 복사"
                        >
                          🔗
                        </button>
                        <button
                          onClick={() => handleSendSms(winner)}
                          disabled={sendingSmsId === winner.id}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
                          title="SMS 문자 발송"
                        >
                          {sendingSmsId === winner.id ? (
                            <span className="spinner w-4 h-4"></span>
                          ) : (
                            '📱'
                          )}
                        </button>
                        <button
                          onClick={() => handleSendKakao(winner)}
                          disabled={sendingKakaoId === winner.id}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-warning hover:bg-warning/5 transition-all disabled:opacity-50"
                          title="카카오톡 발송"
                        >
                          {sendingKakaoId === winner.id ? (
                            <span className="spinner w-4 h-4"></span>
                          ) : (
                            '💬'
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(winner.id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-danger hover:bg-danger/5 transition-all"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => handlePageChange(initialPage - 1)}
                disabled={initialPage <= 1 || isPending}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← 이전
              </button>

              <div className="pagination">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (initialPage <= 3) {
                    pageNum = i + 1;
                  } else if (initialPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = initialPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isPending}
                      className={`pagination-btn ${
                        pageNum === initialPage
                          ? 'pagination-btn-active'
                          : 'pagination-btn-inactive'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(initialPage + 1)}
                disabled={initialPage >= totalPages || isPending}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음 →
              </button>

              <span className="ml-4 text-sm text-gray-500 font-medium">
                {(initialPage - 1) * pageSize + 1}-{Math.min(initialPage * pageSize, totalCount)} / {totalCount}명
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

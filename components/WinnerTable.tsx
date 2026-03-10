'use client';

import { Winner } from '@/lib/supabase';

type WinnerTableProps = {
  winners: Winner[];
  onStatusChange: (id: string, status: '대기' | '발송완료') => void;
  onDelete: (id: string) => void;
  onCopyLink: (token: string) => void;
  onSendKakao: (winner: Winner) => void;
  sendingKakaoId: string | null;
};

export default function WinnerTable({ winners, onStatusChange, onDelete, onCopyLink, onSendKakao, sendingKakaoId }: WinnerTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              당첨자
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              고유번호
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              연락처
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              방송일자
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              상품 / 대행사
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              주소
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              상태
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              액션
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {winners.map((winner) => (
            <tr key={winner.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{winner.name}</div>
                <div className="text-xs text-gray-500">
                  {new Date(winner.created_at).toLocaleDateString('ko-KR')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                {winner.unique_code || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {winner.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {winner.broadcast_date ? new Date(winner.broadcast_date).toLocaleDateString('ko-KR') : '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {winner.winner_products && winner.winner_products.length > 0 ? (
                  <div className="space-y-1">
                    {winner.winner_products.map((wp, index) => (
                      <div key={wp.id} className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {index + 1}. {wp.product?.name || '-'}
                        </span>
                        {wp.product?.taxable && (
                          <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
                            과세
                          </span>
                        )}
                        {wp.product?.agency && (
                          <span className="text-xs text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                            {wp.product.agency}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                {winner.address_submitted ? (
                  <span className="text-gray-900">{winner.address}</span>
                ) : (
                  <span className="text-yellow-600">주소 미입력</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    winner.status === '발송완료'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {winner.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                {!winner.address_submitted && (
                  <>
                    <button
                      onClick={() => onSendKakao(winner)}
                      disabled={sendingKakaoId === winner.id}
                      className="text-yellow-500 hover:text-yellow-600 disabled:text-yellow-300"
                      title="카카오톡 알림톡 발송"
                    >
                      {sendingKakaoId === winner.id ? '발송중...' : '카톡발송'}
                    </button>
                    <button
                      onClick={() => onCopyLink(winner.form_token)}
                      className="text-rose-400 hover:text-rose-500"
                      title="주소 입력 링크 복사"
                    >
                      링크복사
                    </button>
                  </>
                )}
                {winner.status === '대기' && winner.address_submitted && (
                  <button
                    onClick={() => onStatusChange(winner.id, '발송완료')}
                    className="text-green-600 hover:text-green-900"
                  >
                    발송완료
                  </button>
                )}
                {winner.status === '발송완료' && (
                  <button
                    onClick={() => onStatusChange(winner.id, '대기')}
                    className="text-yellow-600 hover:text-yellow-900"
                  >
                    대기로변경
                  </button>
                )}
                <button
                  onClick={() => onDelete(winner.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

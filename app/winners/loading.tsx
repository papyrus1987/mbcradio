export default function WinnersLoading() {
  return (
    <div className="animate-pulse">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-28" />
        </div>
      </div>

      {/* 필터 버튼 */}
      <div className="mb-4 flex gap-2">
        <div className="h-10 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-200 rounded w-20" />
        <div className="h-10 bg-gray-200 rounded w-24" />
      </div>

      {/* 테이블 스켈레톤 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex bg-gray-50 p-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
            ))}
          </div>
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex p-4 gap-4 border-b border-gray-100">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* 헤더 배너 스켈레톤 */}
      <div className="bg-slate-300 rounded-2xl p-8 mb-8 h-32" />

      {/* 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>

      {/* 빠른 작업 스켈레톤 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-300 rounded-xl p-6 h-24" />
        <div className="bg-gray-400 rounded-xl p-6 h-24" />
      </div>
    </div>
  );
}

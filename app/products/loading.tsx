export default function ProductsLoading() {
  return (
    <div className="animate-pulse">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-28" />
        <div className="h-10 bg-gray-200 rounded w-24" />
      </div>

      {/* 상품 카드 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded flex-1" />
              <div className="h-8 bg-gray-200 rounded flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

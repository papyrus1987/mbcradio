type StockBadgeProps = {
  stock: number;
};

export default function StockBadge({ stock }: StockBadgeProps) {
  if (stock === 0) {
    return (
      <span className="badge badge-danger">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
        </span>
        품절
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="badge badge-warning">
        재고 부족 ({stock})
      </span>
    );
  }

  return (
    <span className="badge badge-success">
      재고 {stock}개
    </span>
  );
}

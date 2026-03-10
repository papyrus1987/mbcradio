type StockBadgeProps = {
  stock: number;
};

export default function StockBadge({ stock }: StockBadgeProps) {
  let colorClass = 'bg-green-100 text-green-800';

  if (stock === 0) {
    colorClass = 'bg-red-100 text-red-800';
  } else if (stock <= 5) {
    colorClass = 'bg-yellow-100 text-yellow-800';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      재고: {stock}개
      {stock === 0 && ' (품절)'}
      {stock > 0 && stock <= 5 && ' (부족)'}
    </span>
  );
}

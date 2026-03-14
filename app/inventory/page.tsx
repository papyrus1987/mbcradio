import { createClient } from '@supabase/supabase-js';
import { Product } from '@/lib/supabase';
import InventoryClient from './InventoryClient';

type InventoryItem = Product & {
  usedCount: number;
  remainingStock: number;
};

async function getInventoryData(): Promise<InventoryItem[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 병렬로 데이터 가져오기
  const [productsResult, usageResult] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .order('agency', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('winner_products')
      .select('product_id'),
  ]);

  if (productsResult.error) {
    console.error('Error fetching products:', productsResult.error);
    return [];
  }

  // 사용량 계산
  const usageMap: Record<string, number> = {};
  usageResult.data?.forEach((item) => {
    usageMap[item.product_id] = (usageMap[item.product_id] || 0) + 1;
  });

  // 데이터 결합
  const items: InventoryItem[] = (productsResult.data || []).map((product) => {
    const usedCount = usageMap[product.id] || 0;
    return {
      ...product,
      usedCount,
      remainingStock: product.stock - usedCount,
    };
  });

  return items;
}

export default async function InventoryPage() {
  const inventoryItems = await getInventoryData();

  return <InventoryClient initialItems={inventoryItems} />;
}

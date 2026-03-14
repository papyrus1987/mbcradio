import { createClient } from '@supabase/supabase-js';
import { Product } from '@/lib/supabase';
import ProductsClient from './ProductsClient';

async function getProducts(): Promise<Product[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

export default async function ProductsPage() {
  const products = await getProducts();

  return <ProductsClient initialProducts={products} />;
}

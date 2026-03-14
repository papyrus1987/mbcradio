import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  name: string;
  stock: number;
  agency: string | null;
  price: number;
  taxable?: boolean;
  status?: string;
  incoming?: number;
  transfer?: number;
  created_at: string;
};

export type WinnerProduct = {
  id: string;
  winner_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
};

export type Winner = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  resident_id: string | null;
  unique_code: string;
  status: '대기' | '발송완료';
  created_at: string;
  address_submitted: boolean;
  phone_verified: boolean;
  form_token: string;
  broadcast_date: string;
  winner_products?: WinnerProduct[];
};

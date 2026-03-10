-- Supabase에서 실행할 SQL 스크립트

-- products 테이블 (상품)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  agency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- winners 테이블 (당첨자)
CREATE TABLE winners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT '대기' CHECK (status IN ('대기', '발송완료')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  address_submitted BOOLEAN DEFAULT FALSE,
  form_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  broadcast_date DATE NOT NULL
);

-- winner_products 테이블 (당첨자-상품 연결, 1:N)
CREATE TABLE winner_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  winner_id UUID NOT NULL REFERENCES winners(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_winners_status ON winners(status);
CREATE INDEX idx_winners_form_token ON winners(form_token);
CREATE INDEX idx_winner_products_winner_id ON winner_products(winner_id);
CREATE INDEX idx_winner_products_product_id ON winner_products(product_id);

-- RLS (Row Level Security) 비활성화 (개발용)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE winner_products ENABLE ROW LEVEL SECURITY;

-- 모든 접근 허용 정책 (개발용)
CREATE POLICY "Allow all access to products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to winners" ON winners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to winner_products" ON winner_products FOR ALL USING (true) WITH CHECK (true);

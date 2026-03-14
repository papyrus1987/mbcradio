'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, Product } from '@/lib/supabase';

type InventoryItem = Product & {
  usedCount: number;
  remainingStock: number;
};

type ViewMode = 'all' | 'byAgency';

type Props = {
  initialItems: InventoryItem[];
};

export default function InventoryClient({ initialItems }: Props) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialItems);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInventory = useCallback(async () => {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('agency', { ascending: true })
      .order('name', { ascending: true });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    const { data: usageCounts, error: usageError } = await supabase
      .from('winner_products')
      .select('product_id');

    if (usageError) {
      console.error('Error fetching usage counts:', usageError);
      return;
    }

    const usageMap: Record<string, number> = {};
    usageCounts?.forEach((item) => {
      usageMap[item.product_id] = (usageMap[item.product_id] || 0) + 1;
    });

    const items: InventoryItem[] = (products || []).map((product) => {
      const usedCount = usageMap[product.id] || 0;
      return {
        ...product,
        usedCount,
        remainingStock: product.stock - usedCount,
      };
    });

    setInventoryItems(items);
  }, []);

  useEffect(() => {
    const productsSubscription = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    const winnerProductsSubscription = supabase
      .channel('winner-products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'winner_products' },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsSubscription);
      supabase.removeChannel(winnerProductsSubscription);
    };
  }, [fetchInventory]);

  const itemsByAgency = inventoryItems.reduce((acc, item) => {
    const agency = item.agency || '대행사 없음';
    if (!acc[agency]) {
      acc[agency] = [];
    }
    acc[agency].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  async function handleAddProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddLoading(true);

    const formData = new FormData(e.currentTarget);
    const product = {
      name: formData.get('name') as string,
      stock: parseInt(formData.get('stock') as string) || 0,
      agency: formData.get('agency') as string || null,
      taxable: formData.get('taxable') === 'on',
    };

    const { error } = await supabase.from('products').insert([product]);

    if (error) {
      console.error('Error creating product:', error);
      alert('상품 추가에 실패했습니다.');
    } else {
      setShowAddModal(false);
      fetchInventory();
    }
    setAddLoading(false);
  }

  async function handleDelete(id: string, name: string, usedCount: number) {
    if (usedCount > 0) {
      if (!confirm(`"${name}" 상품은 ${usedCount}명의 당첨자에게 배정되어 있습니다.\n정말 삭제하시겠습니까?`)) {
        return;
      }
    } else {
      if (!confirm(`"${name}" 상품을 삭제하시겠습니까?`)) {
        return;
      }
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      alert('상품 삭제에 실패했습니다.');
    } else {
      fetchInventory();
    }
  }

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);

    try {
      const XLSX = await import('xlsx');

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet || worksheet === undefined) {
        const isHancom = workbook.Props?.Application === 'Cell';
        if (isHancom) {
          alert('한컴 Cell로 만든 파일은 직접 읽을 수 없습니다.\n\n해결 방법:\n1. 한컴 Cell에서 "다른 이름으로 저장" → CSV 선택\n2. 또는 Microsoft Excel에서 열고 다시 저장');
        } else {
          alert('엑셀 파일을 읽을 수 없습니다.\n파일이 손상되었거나 지원하지 않는 형식입니다.');
        }
        setUploadLoading(false);
        return;
      }

      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      if (rawData.length === 0) {
        alert('엑셀 파일에 데이터가 없습니다.');
        setUploadLoading(false);
        return;
      }

      let headerRowIndex = -1;
      const headerKeywords = ['상품명', '상품', '품명', 'name', 'Name', '품목', '제품명'];

      for (let i = 0; i < Math.min(rawData.length, 10); i++) {
        const row = rawData[i];
        if (row && Array.isArray(row)) {
          const hasHeader = row.some(cell =>
            cell && headerKeywords.some(keyword =>
              String(cell).includes(keyword)
            )
          );
          if (hasHeader) {
            headerRowIndex = i;
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        headerRowIndex = 0;
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex,
        defval: ''
      }) as Record<string, unknown>[];

      if (jsonData.length === 0) {
        alert(`엑셀 파일에서 데이터를 읽을 수 없습니다.\n시트명: ${sheetName}\n전체 행 수: ${rawData.length}`);
        setUploadLoading(false);
        return;
      }

      const firstRow = jsonData[0];
      const columns = Object.keys(firstRow);

      const nameKey = columns.find(c =>
        c.includes('상품') || c.includes('품명') || c.includes('품목') || c.includes('제품') ||
        c.toLowerCase().includes('name') || c.toLowerCase().includes('product')
      );
      const stockKey = columns.find(c =>
        c.includes('재고') || c.includes('수량') || c.includes('갯수') || c.includes('개수') ||
        c.includes('입고') ||
        c.toLowerCase().includes('stock') || c.toLowerCase().includes('qty') || c.toLowerCase().includes('quantity')
      );
      const agencyKey = columns.find(c =>
        c.includes('대행사') || c.includes('업체') || c.includes('거래처') || c.includes('협찬사') ||
        c.toLowerCase().includes('agency') || c.toLowerCase().includes('vendor')
      );
      const taxableKey = columns.find(c =>
        c.includes('과세') || c.toLowerCase().includes('tax')
      );

      const products = jsonData.map((row) => {
        const rawName = nameKey ? row[nameKey] : '';
        const stock = stockKey ? row[stockKey] : 0;
        let agency = agencyKey ? row[agencyKey] : null;
        const taxableValue = taxableKey ? row[taxableKey] : '';

        if (!rawName || String(rawName).trim() === '') return null;

        let name = String(rawName).trim();

        if (!agency) {
          const match = name.match(/^(.+?)\(([^)]+)\)$/);
          if (match) {
            name = match[1].trim();
            agency = match[2].trim();
          }
        }

        const stockValue = typeof stock === 'number' ? stock : parseInt(String(stock).replace(/,/g, ''));
        if (isNaN(stockValue) && !agencyKey) {
          return null;
        }

        const taxable = ['O', 'o', 'Y', 'y', 'Yes', 'yes', 'YES', 'TRUE', 'true', '1', 1, true].includes(taxableValue as string | number | boolean);

        return {
          name,
          stock: isNaN(stockValue) ? 0 : stockValue,
          agency: agency ? String(agency).trim() : null,
          taxable,
        };
      }).filter((p): p is { name: string; stock: number; agency: string | null; taxable: boolean } => p !== null && p.name !== '');

      if (products.length === 0) {
        alert(`유효한 상품 데이터가 없습니다.\n\n감지된 컬럼: ${columns.join(', ')}\n\n"상품명" 또는 "상품"이 포함된 컬럼이 필요합니다.`);
        setUploadLoading(false);
        return;
      }

      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, name');

      const existingNames = new Map(existingProducts?.map(p => [p.name, p.id]) || []);

      let insertCount = 0;
      let updateCount = 0;

      for (const product of products) {
        const existingId = existingNames.get(product.name);

        if (existingId) {
          await supabase
            .from('products')
            .update({ stock: product.stock, agency: product.agency, taxable: product.taxable })
            .eq('id', existingId);
          updateCount++;
        } else {
          await supabase.from('products').insert([product]);
          insertCount++;
        }
      }

      alert(`엑셀 업로드 완료!\n- 신규 추가: ${insertCount}개\n- 업데이트: ${updateCount}개`);
      fetchInventory();
    } catch (error) {
      console.error('Error uploading Excel:', error);
      alert('엑셀 파일 처리 중 오류가 발생했습니다.');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">재고 관리</h1>
          <p className="text-gray-500 mt-1">총 <span className="font-semibold text-primary">{inventoryItems.length}</span>개의 상품</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="tab-group">
            <button
              onClick={() => setViewMode('all')}
              className={`tab ${viewMode === 'all' ? 'tab-active' : ''}`}
            >
              전체 보기
            </button>
            <button
              onClick={() => setViewMode('byAgency')}
              className={`tab ${viewMode === 'byAgency' ? 'tab-active' : ''}`}
            >
              대행사별
            </button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <span>+</span>
            상품 추가
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading}
            className="btn-success disabled:opacity-50"
          >
            {uploadLoading ? (
              <>
                <span className="spinner"></span>
                업로드 중...
              </>
            ) : (
              <>
                <span>📤</span>
                엑셀 업로드
              </>
            )}
          </button>
        </div>
      </div>

      {inventoryItems.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <span className="text-3xl">📦</span>
          </div>
          <p className="text-gray-600 font-semibold text-lg">등록된 상품이 없습니다</p>
          <button onClick={() => setShowAddModal(true)} className="mt-4 btn-primary">
            첫 상품을 추가해보세요
          </button>
        </div>
      ) : viewMode === 'all' ? (
        <div className="table-container overflow-x-auto scrollbar-thin">
          <table className="table-premium">
            <thead>
              <tr>
                <th>상품명</th>
                <th>대행사</th>
                <th className="text-center">등록 재고</th>
                <th className="text-center">사용</th>
                <th className="text-center">남은 재고</th>
                <th className="text-center">비고</th>
                <th className="text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => (
                <tr key={item.id} style={item.remainingStock <= 0 ? { background: 'rgba(239, 71, 111, 0.05)' } : {}}>
                  <td className="font-semibold text-gray-900">{item.name}</td>
                  <td className="text-gray-500">{item.agency || '-'}</td>
                  <td className="text-center text-gray-600">{item.stock}</td>
                  <td className="text-center text-gray-600">{item.usedCount}</td>
                  <td className="text-center">
                    {item.remainingStock <= 0 ? (
                      <span className="badge badge-danger">품절</span>
                    ) : item.remainingStock <= 3 ? (
                      <span className="badge badge-warning">{item.remainingStock}</span>
                    ) : (
                      <span className="badge badge-success">{item.remainingStock}</span>
                    )}
                  </td>
                  <td className="text-center">
                    <span className={`badge ${item.status === '중지' ? 'badge-neutral' : 'badge-info'}`}>
                      {item.status || '진행'}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => handleDelete(item.id, item.name, item.usedCount)}
                      className="text-danger hover:text-danger-dark font-semibold text-sm transition-colors"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(itemsByAgency).map(([agency, items]) => (
            <div key={agency} className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100"
                   style={{ background: 'linear-gradient(135deg, rgba(255,140,66,0.05) 0%, rgba(230,57,70,0.05) 100%)' }}>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  {agency}
                  <span className="badge badge-neutral ml-2">{items.length}개</span>
                </h2>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>상품명</th>
                      <th className="text-center">등록 재고</th>
                      <th className="text-center">사용</th>
                      <th className="text-center">남은 재고</th>
                      <th className="text-center">비고</th>
                      <th className="text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} style={item.remainingStock <= 0 ? { background: 'rgba(239, 71, 111, 0.05)' } : {}}>
                        <td className="font-semibold text-gray-900">{item.name}</td>
                        <td className="text-center text-gray-600">{item.stock}</td>
                        <td className="text-center text-gray-600">{item.usedCount}</td>
                        <td className="text-center">
                          {item.remainingStock <= 0 ? (
                            <span className="badge badge-danger">품절</span>
                          ) : item.remainingStock <= 3 ? (
                            <span className="badge badge-warning">{item.remainingStock}</span>
                          ) : (
                            <span className="badge badge-success">{item.remainingStock}</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className={`badge ${item.status === '중지' ? 'badge-neutral' : 'badge-info'}`}>
                            {item.status || '진행'}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => handleDelete(item.id, item.name, item.usedCount)}
                            className="text-danger hover:text-danger-dark font-semibold text-sm transition-colors"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                   style={{ background: 'linear-gradient(135deg, rgba(255,140,66,0.15) 0%, rgba(230,57,70,0.1) 100%)' }}>
                📦
              </div>
              <h2 className="text-xl font-bold text-gray-900">상품 추가</h2>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-5">
              <div>
                <label className="input-label">
                  상품명 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="상품명을 입력하세요"
                  className="input"
                />
              </div>

              <div>
                <label className="input-label">
                  재고 수량 <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  defaultValue="0"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="input-label">대행사</label>
                <input
                  type="text"
                  name="agency"
                  placeholder="대행사명을 입력하세요"
                  className="input"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  name="taxable"
                  id="taxable"
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="taxable" className="text-sm font-medium text-gray-700">
                  과세 상품 (주민등록번호 입력 필요)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {addLoading ? (
                    <>
                      <span className="spinner"></span>
                      저장 중...
                    </>
                  ) : (
                    '추가'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '대시보드' },
    { href: '/winners', label: '당첨자 관리' },
    { href: '/products', label: '상품 관리' },
  ];

  return (
    <nav className="bg-gradient-to-r from-rose-300 to-rose-400 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📻</span>
            <div>
              <div className="text-xs text-rose-100">MBC라디오</div>
              <div className="text-lg font-bold leading-tight">여성시대 상품관리</div>
            </div>
          </Link>
          <div className="flex space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-white text-rose-500'
                    : 'text-white/80 hover:bg-rose-400/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

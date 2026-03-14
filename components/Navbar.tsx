'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '대시보드', icon: '📊' },
    { href: '/winners', label: '당첨자', icon: '🏆' },
    { href: '/products', label: '상품', icon: '🎁' },
    { href: '/inventory', label: '재고', icon: '📦' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white text-lg">📻</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold tracking-widest text-primary uppercase">MBC Radio</div>
              <div className="text-base font-bold text-gray-900 -mt-0.5 tracking-tight">여성시대</div>
            </div>
          </Link>

          {/* 네비게이션 */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-100/80">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300
                    flex items-center gap-2
                    ${isActive
                      ? 'bg-white text-primary shadow-md'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                    }
                  `}
                >
                  <span className={`text-base transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="hidden md:inline">{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 우측 상태 표시 */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-success/10 rounded-xl border border-success/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
              </span>
              <span className="text-xs font-semibold text-success-dark">실시간 연동</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

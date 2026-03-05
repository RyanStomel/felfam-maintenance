'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, PlusCircle, Settings } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/requests/new', label: 'New Request', icon: PlusCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center justify-center min-w-[64px] min-h-[44px] px-3 py-1 rounded-lg transition-colors',
                isActive
                  ? 'text-navy'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <item.icon className={clsx('w-6 h-6', isActive && 'stroke-[2.5px]')} />
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  Send,
  BarChart3,
  Settings,
  Target,
  MessageSquare,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Posts', href: '/posts', icon: FileText },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Outreach', href: '/outreach', icon: Send },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

const settingsNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'ICP Profiles', href: '/settings/icp', icon: Target },
  { name: 'Templates', href: '/settings/templates', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex w-64 flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r bg-card">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-primary">TriageLink</h1>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon
                      className={cn('mr-3 h-5 w-5 flex-shrink-0')}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}

              <div className="pt-6">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Settings
                </p>
                <div className="mt-2 space-y-1">
                  {settingsNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon
                          className={cn('mr-3 h-5 w-5 flex-shrink-0')}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}

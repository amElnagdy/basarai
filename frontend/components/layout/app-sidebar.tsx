'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import {
  History,
  Key,
  LogOut,
  Palette,
  Plus,
  Settings,
  Sliders,
  Sparkles,
  User,
} from 'lucide-react'
import { BrandDot } from '@/components/brand/brand-dot'
import { Badge } from '@/components/ui/badge'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Separator } from '@/components/ui/separator'
import { KitStatusBadge } from '@/components/kit/kit-status-badge'
import { cn } from '@/lib/utils'
import type { BrandListItem, Profile } from '@/types'

interface AppSidebarProps {
  brands: BrandListItem[]
  accents: Record<string, string>
  currentBrandId?: string
  profile: Profile | null
  onCreateBrand: () => void
}

export function AppSidebar({
  brands,
  accents,
  currentBrandId,
  profile,
  onCreateBrand,
}: AppSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const activeBrand = brands.find((b) => b.id === currentBrandId) ?? brands[0]
  const workspaceId = currentBrandId ?? activeBrand?.id

  async function handleLogout() {
    await signOut({ redirectUrl: '/login' })
  }

  const nav = workspaceId
    ? [
        { href: `/${workspaceId}`, label: 'Generate', icon: Sparkles, match: 'exact' as const },
        { href: `/${workspaceId}/history`, label: 'History', icon: History, match: 'prefix' as const },
        { href: `/${workspaceId}/kit`, label: 'Brand Kit', icon: Palette, match: 'prefix' as const },
        { href: `/${workspaceId}/keys`, label: 'Keys', icon: Key, match: 'prefix' as const },
        { href: `/${workspaceId}/settings`, label: 'Settings', icon: Settings, match: 'prefix' as const },
      ]
    : []

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col overflow-y-auto border-r border-border bg-background px-3 py-4">
      <Link href="/brands" className="mb-6 flex items-center gap-2 px-1 no-underline">
        <span className="font-display text-[27px] leading-none tracking-tight">Basar</span>
        <span
          className="inline-block h-2 w-2 -translate-y-[3px] rounded-full bg-brand"
          aria-hidden
        />
      </Link>

      <Eyebrow className="px-1">Workspace</Eyebrow>
      <div className="mt-2 flex flex-wrap items-center gap-[9px] px-1">
        {brands.map((brand) => {
          const selected = brand.id === currentBrandId
          return (
            <Link
              key={brand.id}
              href={`/${brand.id}`}
              title={brand.name}
              className="rounded-full no-underline focus-visible:shadow-[0_0_0_3px_var(--brand-ring)]"
            >
              <BrandDot
                color={accents[brand.id]}
                logoUrl={brand.logo_url}
                name={brand.name}
                selected={selected}
              />
            </Link>
          )
        })}
        <button
          type="button"
          onClick={onCreateBrand}
          title="Create brand"
          className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors duration-fast hover:border-brand hover:text-brand"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {activeBrand && (
        <p className="mt-2 truncate px-1 text-[12px] font-medium">{activeBrand.name}</p>
      )}
      <Link
        href="/brands"
        className="mt-0.5 px-1 text-[12px] text-muted-foreground no-underline hover:text-brand"
      >
        All brands ›
      </Link>

      <nav className="mt-5 flex flex-col gap-[3px]">
        {nav.map((item) => {
          const active =
            item.match === 'exact'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-[33px] items-center gap-[11px] rounded-[10px] px-[11px] text-[14px] font-medium no-underline transition-colors duration-fast',
                active
                  ? 'bg-brand-weak text-foreground'
                  : 'text-foreground hover:bg-accent',
              )}
            >
              <Icon
                className={cn('h-[18px] w-[18px]', active ? 'text-brand' : 'text-muted-foreground')}
              />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Brand Kit' && activeBrand && (
                <KitStatusBadge status={activeBrand.kit_status} />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-4">
        <Separator className="mb-2" />
        {profile?.is_admin && (
          <Link
            href="/admin"
            className={cn(
              'flex h-[33px] items-center gap-[11px] rounded-[10px] px-[11px] text-[14px] font-medium no-underline transition-colors duration-fast hover:bg-accent',
              pathname.startsWith('/admin') && 'bg-brand-weak',
            )}
          >
            <Sliders className="h-[18px] w-[18px] text-muted-foreground" />
            <span className="flex-1">Admin</span>
            <Badge>Op</Badge>
          </Link>
        )}
        <Link
          href="/account"
          className={cn(
            'flex h-[33px] items-center gap-[11px] rounded-[10px] px-[11px] text-[14px] font-medium no-underline transition-colors duration-fast hover:bg-accent',
            pathname.startsWith('/account') && 'bg-brand-weak',
          )}
        >
          <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-secondary">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <span className="truncate">{profile?.full_name || 'You'}</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-[33px] items-center gap-[11px] rounded-[10px] px-[11px] text-left text-[14px] font-medium text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log out
        </button>
      </div>
    </aside>
  )
}

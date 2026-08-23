'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { PanelLeft } from 'lucide-react'
import { BrandWorkspace } from '@/components/brand/brand-workspace'
import { CreateBrandModal } from '@/components/brand/create-brand-modal'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useBrands } from '@/hooks/use-brands'
import { useProfile } from '@/hooks/use-profile'
import { cn } from '@/lib/utils'
import type { Brand } from '@/types'

function isNeutralRoute(pathname: string) {
  return (
    pathname === '/brands' ||
    pathname.startsWith('/brands/') ||
    pathname === '/account' ||
    pathname.startsWith('/account/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const currentBrandId = typeof params.brandId === 'string' ? params.brandId : undefined
  const { brands, accents, addBrand } = useBrands()
  const { profile } = useProfile()
  const [createOpen, setCreateOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [narrow, setNarrow] = useState(false)

  const wearBrand = Boolean(currentBrandId) && !isNeutralRoute(pathname)
  const accent = currentBrandId ? accents[currentBrandId] : undefined

  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const sync = () => setNarrow(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  function handleBrandCreated(brand: Brand) {
    addBrand(brand)
    router.push(`/${brand.id}`)
  }

  const shell = (
    <div className="grid h-screen grid-cols-1 overflow-hidden bg-background md:grid-cols-[248px_1fr]">
      {navOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-[#0B1220]/40 md:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}
      <div
        inert={narrow && !navOpen ? true : undefined}
        className={cn(
          'z-40 h-full w-[248px] max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:bg-background max-md:shadow-lg max-md:transition-transform max-md:duration-fast max-md:ease-out',
          navOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        )}
      >
        <AppSidebar
          brands={brands}
          accents={accents}
          currentBrandId={currentBrandId}
          profile={profile}
          onCreateBrand={() => setCreateOpen(true)}
        />
      </div>
      <div className="flex min-w-0 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-[22px] leading-none">Basar</span>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 md:px-[30px] md:py-6">
          {children}
        </main>
      </div>
      <CreateBrandModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onBrandCreated={handleBrandCreated}
      />
    </div>
  )

  if (wearBrand) {
    return <BrandWorkspace color={accent}>{shell}</BrandWorkspace>
  }

  return shell
}

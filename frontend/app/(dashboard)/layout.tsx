'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useBrands } from '@/hooks/use-brands'
import { useProfile } from '@/hooks/use-profile'
import { BrandSelector } from '@/components/brand-selector'
import { BrandsProvider } from '@/components/providers/brands-provider'

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const params = useParams()
  const currentBrandId = params.brandId as string | undefined
  const { brands } = useBrands()
  const { profile } = useProfile()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/brands" className="font-semibold">
            Basar AI
          </Link>
          <div className="flex items-center gap-4">
            {brands.length > 0 && (
              <BrandSelector brands={brands} currentBrandId={currentBrandId} />
            )}
            <Link
              href="/account"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Account
            </Link>
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BrandsProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </BrandsProvider>
  )
}

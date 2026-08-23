'use client'

import { AppShell } from '@/components/layout/app-shell'
import { BrandsProvider } from '@/components/providers/brands-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BrandsProvider>
      <AppShell>{children}</AppShell>
    </BrandsProvider>
  )
}

'use client'

import { notFound } from 'next/navigation'
import { useProfile } from '@/hooks/use-profile'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, loading } = useProfile()

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  if (!profile?.is_admin) {
    notFound()
  }

  return <>{children}</>
}

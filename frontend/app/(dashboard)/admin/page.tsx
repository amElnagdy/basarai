'use client'

import { useEffect, useState } from 'react'
import { AdminBrandsTable } from '@/components/admin/admin-brands-table'
import { AdminStatsCards } from '@/components/admin/admin-stats-cards'
import { Badge } from '@/components/ui/badge'
import { useAdminBrands } from '@/hooks/use-admin-brands'
import { apiRequest } from '@/lib/api'
import { AdminStats } from '@/types'

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const adminBrands = useAdminBrands()

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)
        const data = await apiRequest<AdminStats>('/admin/stats')
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[30px] font-semibold leading-[1.16] tracking-tight">Admin Dashboard</h1>
        <Badge>Operator</Badge>
      </div>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Platform-wide totals across every account.
      </p>

      {loading && <p className="mt-4 text-muted-foreground">Loading…</p>}

      {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}

      {!loading && !error && stats && (
        <div className="mt-6">
          <AdminStatsCards stats={stats} />
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-[22px] font-semibold tracking-tight">All brands</h2>
        <div className="mt-4">
          <AdminBrandsTable
            items={adminBrands.items}
            page={adminBrands.page}
            perPage={adminBrands.perPage}
            total={adminBrands.total}
            hasNext={adminBrands.hasNext}
            hasPrev={adminBrands.hasPrev}
            loading={adminBrands.loading}
            error={adminBrands.error}
            onNext={adminBrands.nextPage}
            onPrev={adminBrands.prevPage}
          />
        </div>
      </section>
    </div>
  )
}

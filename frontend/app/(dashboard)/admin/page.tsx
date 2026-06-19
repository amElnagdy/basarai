'use client'

import { useEffect, useState } from 'react'
import { AdminStatsCards } from '@/components/admin/admin-stats-cards'
import { apiRequest } from '@/lib/api'
import { AdminStats } from '@/types'

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      {loading && <p className="mt-4 text-muted-foreground">Loading...</p>}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && stats && (
        <div className="mt-4">
          <AdminStatsCards stats={stats} />
        </div>
      )}
    </div>
  )
}

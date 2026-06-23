import { AdminStats } from '@/types'

interface AdminStatsCardsProps {
  stats: AdminStats
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Accounts" value={stats.total_accounts} />
        <StatCard label="Brands" value={stats.total_brands} />
        <StatCard label="Generations" value={stats.total_generations} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={stats.generations_by_status.pending} />
        <StatCard
          label="Processing"
          value={stats.generations_by_status.processing}
        />
        <StatCard label="Succeeded" value={stats.generations_by_status.succeeded} />
        <StatCard label="Failed" value={stats.generations_by_status.failed} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="OpenAI generations" value={stats.generations_by_provider.openai} />
        <StatCard label="Gemini generations" value={stats.generations_by_provider.gemini} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Last 7 days" value={stats.generations_last_7d} />
        <StatCard label="Last 30 days" value={stats.generations_last_30d} />
        <StatCard label="Completed brand kits" value={stats.brand_kits_complete} />
        <StatCard label="Active provider keys" value={stats.active_provider_keys} />
      </div>
    </div>
  )
}

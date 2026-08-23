'use client'

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KitStatusBadge } from '@/components/kit/kit-status-badge'
import type { AdminBrandListItem, KitStatus } from '@/types'

interface AdminBrandsTableProps {
  items: AdminBrandListItem[]
  page: number
  perPage: number
  total: number
  hasNext: boolean
  hasPrev: boolean
  loading: boolean
  error: string | null
  onNext: () => void
  onPrev: () => void
}

function isKitStatus(status: string): status is KitStatus {
  return status === 'not_started' || status === 'in_progress' || status === 'complete'
}

function formatCreatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export function AdminBrandsTable({
  items,
  page,
  perPage,
  total,
  hasNext,
  hasPrev,
  loading,
  error,
  onNext,
  onPrev,
}: AdminBrandsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-[color-mix(in_srgb,hsl(var(--destructive))_8%,white)] p-4">
        <p className="text-[13px] text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-muted-foreground">
          {total} total brands · Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onPrev}
            disabled={!hasPrev || loading}
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onNext}
            disabled={!hasNext || loading}
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[13px] text-muted-foreground">No brands found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-surface-sunken text-left text-micro font-semibold uppercase tracking-[0.09em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Brand name</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Kit status</th>
                <th className="px-4 py-3 text-right">Generations</th>
                <th className="px-4 py-3">Active key</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className={loading ? 'opacity-60' : undefined}>
              {items.map((brand) => (
                <tr
                  key={brand.id}
                  className="border-t border-border-subtle hover:bg-accent"
                >
                  <td className="px-4 py-3 font-semibold">{brand.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {brand.owner_full_name || brand.owner_user_id}
                  </td>
                  <td className="px-4 py-3">
                    {isKitStatus(brand.kit_status) ? (
                      <KitStatusBadge status={brand.kit_status} />
                    ) : (
                      brand.kit_status.replaceAll('_', ' ')
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {brand.generation_count}
                  </td>
                  <td className="px-4 py-3">
                    {brand.has_active_key ? (
                      <Badge variant="success" className="normal-case tracking-normal">Yes</Badge>
                    ) : (
                      <Badge variant="muted" className="normal-case tracking-normal">No</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatCreatedAt(brand.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

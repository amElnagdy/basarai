'use client'

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AdminBrandListItem } from '@/types'

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

const kitStatusLabels: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Complete',
}

function formatKitStatus(status: string) {
  return kitStatusLabels[status] ?? status.replaceAll('_', ' ')
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
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">No brands found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Brand name</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Kit status</th>
                <th className="px-4 py-3 text-right font-medium">Generations</th>
                <th className="px-4 py-3 font-medium">Active key</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className={loading ? 'opacity-60' : undefined}>
              {items.map((brand) => (
                <tr key={brand.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{brand.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {brand.owner_full_name || brand.owner_user_id}
                  </td>
                  <td className="px-4 py-3">{formatKitStatus(brand.kit_status)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {brand.generation_count}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        brand.has_active_key
                          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
                          : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'
                      }
                    >
                      {brand.has_active_key ? 'Yes' : 'No'}
                    </span>
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

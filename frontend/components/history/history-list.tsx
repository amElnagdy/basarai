'use client'

import { Loader2 } from 'lucide-react'
import type { GenerationHistoryItem } from '@/types'
import type { DeleteGenerationOutcome } from '@/hooks/use-delete-generation'
import { Button } from '@/components/ui/button'
import { HistoryCard } from './history-card'

interface HistoryListProps {
  items: GenerationHistoryItem[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasNext: boolean
  onLoadMore: () => void
  brandId: string
  search?: string
  filtered?: boolean
  onDelete: (id: string) => Promise<DeleteGenerationOutcome>
}

export function HistoryList({
  items,
  loading,
  loadingMore,
  error,
  hasNext,
  onLoadMore,
  brandId,
  search,
  filtered = false,
  onDelete,
}: HistoryListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-[color-mix(in_srgb,hsl(var(--destructive))_8%,white)] p-4 text-center">
        <p className="text-[13px] text-destructive">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">
          {filtered
            ? 'No history items match the selected filters.'
            : 'No generation history yet. Create your first image on Generate.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-[11px]">
        {items.map((item) => (
          <HistoryCard key={item.id} item={item} brandId={brandId} search={search} onDelete={onDelete} />
        ))}
      </div>
      {hasNext && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}

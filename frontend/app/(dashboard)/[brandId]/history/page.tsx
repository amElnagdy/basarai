'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGenerationHistory } from '@/hooks/use-generation-history'
import { useDeleteGeneration } from '@/hooks/use-delete-generation'
import { useBrand } from '@/hooks/use-brand'
import { HistoryList } from '@/components/history/history-list'
import { HistoryFilters } from '@/components/history/history-filters'

interface HistoryPageProps {
  params: { brandId: string }
}

function buildHistorySearch(provider?: string, status?: string, preset?: string, cursor?: string | null) {
  const params = new URLSearchParams()
  if (provider) params.set('provider', provider)
  if (status) params.set('status', status)
  if (preset) params.set('preset', preset)
  if (cursor) params.set('cursor', cursor)
  return params.toString()
}

export default function HistoryPage({ params }: HistoryPageProps) {
  const { brandId } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const { brand } = useBrand(brandId)

  const provider = searchParams.get('provider') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const preset = searchParams.get('preset') ?? undefined
  const cursor = searchParams.get('cursor') ?? undefined

  const { items, loading, loadingMore, error, hasNext, activeCursor, loadMore, removeItem } =
    useGenerationHistory(brandId, provider, status, cursor)
  const { deleteGeneration } = useDeleteGeneration(brandId)

  function updateFilters(newProvider?: string, newStatus?: string, newPreset?: string) {
    const qs = buildHistorySearch(newProvider, newStatus, newPreset, null)
    router.push(`/${brandId}/history${qs ? `?${qs}` : ''}`)
  }

  const handleLoadMore = useCallback(async () => {
    const loadedCursor = await loadMore()
    if (!loadedCursor) return
    const qs = buildHistorySearch(provider, status, preset, loadedCursor)
    window.history.replaceState(null, '', `/${brandId}/history${qs ? `?${qs}` : ''}`)
  }, [brandId, loadMore, provider, status, preset])

  const handleDelete = useCallback(
    async (generationId: string) => {
      const outcome = await deleteGeneration(generationId)
      if (outcome.ok) removeItem(generationId)
      return outcome
    },
    [deleteGeneration, removeItem],
  )

  const visibleItems = useMemo(
    () => (preset ? items.filter((item) => item.platform_preset === preset) : items),
    [items, preset],
  )

  const filterString = buildHistorySearch(provider, status, preset, activeCursor) || undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-[1.16] tracking-tight">History</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {brand?.name ?? 'Brand'} · {items.length}{hasNext ? '+' : ''} generations
          </p>
        </div>
        <HistoryFilters
          provider={provider}
          status={status}
          preset={preset}
          onProviderChange={(v) => updateFilters(v, status, preset)}
          onStatusChange={(v) => updateFilters(provider, v, preset)}
          onPresetChange={(v) => updateFilters(provider, status, v)}
        />
      </div>
      <HistoryList
        items={visibleItems}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasNext={hasNext}
        onLoadMore={handleLoadMore}
        brandId={brandId}
        search={filterString}
        filtered={Boolean(provider || status || preset)}
        onDelete={handleDelete}
      />
    </div>
  )
}

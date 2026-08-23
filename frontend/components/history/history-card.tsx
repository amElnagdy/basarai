'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import type { GenerationHistoryItem } from '@/types'
import type { DeleteGenerationOutcome } from '@/hooks/use-delete-generation'
import { PLATFORM_PRESETS } from '@/lib/presets'
import { Badge } from '@/components/ui/badge'
import { DeleteGenerationDialog } from './delete-generation-dialog'

interface HistoryCardProps {
  item: GenerationHistoryItem
  brandId: string
  search?: string
  onDelete: (id: string) => Promise<DeleteGenerationOutcome>
}

export function HistoryCard({ item, brandId, search, onDelete }: HistoryCardProps) {
  const preset = PLATFORM_PRESETS[item.platform_preset]
  const href = `/${brandId}/history/${item.id}${search ? `?${search}` : ''}`
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [imageUnavailable, setImageUnavailable] = useState(false)
  const showImage = Boolean(item.image_url) && !imageUnavailable
  const failed = item.status === 'failed'

  async function handleConfirmDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const outcome = await onDelete(item.id)
      if (!outcome.ok) {
        setDeleteError(outcome.message ?? 'Failed to delete. Please try again.')
      } else {
        setDialogOpen(false)
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-lg border bg-card transition-shadow duration-fast hover:shadow-md">
        <Link href={href} className="block no-underline">
          <div className="aspect-square w-full overflow-hidden bg-surface-sunken">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url ?? undefined}
                alt={item.prompt_excerpt}
                className="h-full w-full object-cover"
                onError={() => setImageUnavailable(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
                <TriangleAlert className="h-5 w-5 text-muted-foreground" />
                <span className="text-[12px] text-muted-foreground">
                  {failed ? 'Failed' : 'Image unavailable'}
                </span>
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="line-clamp-2 break-words text-[12px] leading-snug">{item.prompt_excerpt}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="muted" className="normal-case tracking-normal">
                {item.provider}
              </Badge>
              {preset && (
                <Badge variant="muted" className="normal-case tracking-normal">
                  {preset.shortLabel}
                </Badge>
              )}
              <Badge
                variant={item.status === 'succeeded' ? 'success' : 'danger'}
                className="normal-case tracking-normal"
              >
                {item.status}
              </Badge>
            </div>
            {item.error_message && (
              <p className="mt-1.5 line-clamp-1 break-words text-[12px] text-destructive">
                {item.error_message}
              </p>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDialogOpen(true) }}
          className="absolute right-2 top-2 rounded-md bg-background/80 px-2 py-1 text-[11px] text-destructive opacity-0 backdrop-blur transition-opacity hover:bg-background focus-visible:opacity-100 max-md:opacity-100 group-hover:opacity-100"
        >
          Delete
        </button>
      </div>
      <DeleteGenerationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        error={deleteError}
      />
    </>
  )
}

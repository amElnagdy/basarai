'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PLATFORM_PRESETS } from '@/lib/presets'
import type { GenerationDetail } from '@/types'
import type { DeleteGenerationOutcome } from '@/hooks/use-delete-generation'
import { HistoryDownloadButton } from './history-download-button'
import { DeleteGenerationDialog } from './delete-generation-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Notice } from '@/components/ui/notice'

interface HistoryDetailProps {
  detail: GenerationDetail
  brandId: string
  backSearch?: string
  onDelete: () => Promise<DeleteGenerationOutcome>
  onDeleted: () => void
}

export function HistoryDetail({ detail, brandId, backSearch, onDelete, onDeleted }: HistoryDetailProps) {
  const preset = PLATFORM_PRESETS[detail.platform_preset]
  const backHref = `/${brandId}/history${backSearch ? `?${backSearch}` : ''}`
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [imageUnavailable, setImageUnavailable] = useState(false)
  const showImage = Boolean(detail.image_url) && !imageUnavailable
  const shouldShowUnavailable = detail.status === 'succeeded' && !showImage

  useEffect(() => {
    setImageUnavailable(false)
  }, [detail.id, detail.image_url])

  async function handleConfirmDelete() {
    setDeleting(true)
    setDeleteError(null)
    const outcome = await onDelete()
    setDeleting(false)
    if (outcome.ok) {
      onDeleted()
    } else {
      setDeleteError(outcome.message ?? 'Failed to delete. Please try again.')
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-[13px] text-muted-foreground no-underline hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to History
      </Link>

      {showImage && (
        <div className="overflow-hidden rounded-xl border border-[rgba(15,23,42,.10)] shadow-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={detail.image_url ?? undefined}
            alt={detail.prompt}
            className="w-full"
            onError={() => setImageUnavailable(true)}
          />
        </div>
      )}

      {shouldShowUnavailable && (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed bg-surface-sunken p-6 text-center text-[13px] text-muted-foreground">
          Image unavailable. The saved metadata is still here, but the stored image could not be loaded.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-[13px] font-medium text-muted-foreground">Prompt</h3>
          <p className="mt-1 break-words text-[14px]">{detail.prompt}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="muted" className="normal-case tracking-normal">{detail.provider}</Badge>
          <Badge variant="muted" className="normal-case tracking-normal">{preset?.label ?? detail.platform_preset}</Badge>
          <Badge
            variant={detail.status === 'failed' ? 'danger' : 'success'}
            className="normal-case tracking-normal"
          >
            {detail.status}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Meta label="Model" value={detail.model} />
          <Meta label="Dimensions" value={`${detail.width} × ${detail.height}`} mono />
          <Meta label="Logo mode" value={detail.logo_mode.replace('_', ' ')} />
          <Meta label="Created" value={new Date(detail.created_at).toLocaleString()} />
          {detail.completed_at && (
            <Meta label="Completed" value={new Date(detail.completed_at).toLocaleString()} />
          )}
        </div>

        {detail.status === 'failed' && detail.error_code && (
          <Notice variant="danger">{detail.error_message ?? detail.error_code}</Notice>
        )}
      </div>

      <div className="flex items-start gap-3">
        <HistoryDownloadButton
          imageUrl={detail.image_url}
          downloadFilename={detail.download_filename}
          disabled={imageUnavailable}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogOpen(true)}
          className="border-destructive/30 text-destructive hover:bg-destructive/5"
        >
          Delete
        </Button>
      </div>

      <DeleteGenerationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        error={deleteError}
      />
    </div>
  )
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <h3 className="text-[13px] font-medium text-muted-foreground">{label}</h3>
      <p className={`mt-1 text-[14px] ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</p>
    </div>
  )
}

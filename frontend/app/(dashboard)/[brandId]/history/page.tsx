'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import type { GenerationResponse } from '@/types'

const PRESET_LABELS: Record<string, string> = {
  instagram_post: 'Instagram Post',
  instagram_story: 'Instagram Story',
  instagram_reel_cover: 'Instagram Reel Cover',
  facebook_post: 'Facebook Post',
  facebook_cover: 'Facebook Cover',
  facebook_story: 'Facebook Story',
  twitter_post: 'Twitter Post',
  twitter_header: 'Twitter Header',
  linkedin_post: 'LinkedIn Post',
  linkedin_banner: 'LinkedIn Banner',
  tiktok_video_cover: 'TikTok Video Cover',
  youtube_thumbnail: 'YouTube Thumbnail',
  youtube_banner: 'YouTube Banner',
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function StatusBadge({ status }: { status: GenerationResponse['status'] }) {
  const styles: Record<GenerationResponse['status'], string> = {
    succeeded: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    processing: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-800',
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}

export default function HistoryPage() {
  const params = useParams()
  const brandId = Array.isArray(params.brandId) ? params.brandId[0] : params.brandId ?? ''

  const [items, setItems] = useState<GenerationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!brandId) return
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest<GenerationResponse[]>(`/brands/${brandId}/generations`)
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [brandId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>
  }

  if (error) {
    return <p className="text-red-600">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Generation History</h2>
        <button
          type="button"
          onClick={fetchItems}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No generations yet. Head to the generator to create your first image.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => (
            <div key={g.id} className="overflow-hidden rounded-lg border bg-white">
              <div className="flex aspect-square items-center justify-center bg-gray-50">
                {g.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.image_url}
                    alt={g.prompt}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    {g.status === 'failed'
                      ? g.error_message || 'Generation failed'
                      : 'No image'}
                  </div>
                )}
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {PRESET_LABELS[g.platform_preset] || g.platform_preset}
                  </span>
                  <StatusBadge status={g.status} />
                </div>
                <p className="line-clamp-2 text-sm" title={g.prompt}>
                  {g.prompt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{g.provider}</span>
                  <span>{formatDate(g.created_at)}</span>
                </div>
                {g.image_url && (
                  <a
                    href={g.image_url}
                    download={g.download_filename || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md border px-3 py-1.5 text-center text-sm hover:bg-gray-50"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

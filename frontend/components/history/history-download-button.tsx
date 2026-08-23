'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { downloadImageFile } from '@/lib/download'
import { Button } from '@/components/ui/button'

interface HistoryDownloadButtonProps {
  imageUrl: string | null
  downloadFilename: string | null
  disabled?: boolean
}

export function HistoryDownloadButton({
  imageUrl,
  downloadFilename,
  disabled: forceDisabled = false,
}: HistoryDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const disabled = forceDisabled || !imageUrl || !downloadFilename

  async function handleDownload() {
    if (disabled || !imageUrl || !downloadFilename) return
    setDownloading(true)
    setError(null)
    try {
      await downloadImageFile(imageUrl, downloadFilename)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        onClick={handleDownload}
        disabled={disabled || downloading}
      >
        <Download className="h-4 w-4" />
        {downloading ? 'Downloading…' : 'Download'}
      </Button>
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  )
}

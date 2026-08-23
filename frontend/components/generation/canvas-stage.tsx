'use client'

import { ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aspectRatioLabel, type PresetInfo } from '@/lib/presets'

export type CanvasStatus = 'empty' | 'generating' | 'done'

interface CanvasStageProps {
  status: CanvasStatus
  preset: PresetInfo
  brandName: string
  imageUrl?: string | null
  imageAlt?: string
}

export function CanvasStage({
  status,
  preset,
  brandName,
  imageUrl,
  imageAlt,
}: CanvasStageProps) {
  const landscape = preset.width >= preset.height
  const ratio = `${preset.width} / ${preset.height}`

  return (
    <div
      className="flex min-h-[460px] w-full items-center justify-center rounded-xl p-6"
      style={{
        background:
          'radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--brand) 5%, transparent), transparent 60%), hsl(var(--surface-sunken))',
      }}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-lg transition-[width,height,aspect-ratio,box-shadow,border-color] duration-slow ease-out',
          status === 'empty' && 'border-[1.5px] border-dashed border-[#CBD5E1]',
          status === 'generating' && 'border border-border shadow-md',
          status === 'done' && 'border border-[rgba(15,23,42,.10)] shadow-art',
        )}
        style={{
          aspectRatio: ratio,
          width: landscape
            ? 'min(100%, 640px)'
            : `min(100%, ${Math.round(560 * (preset.width / preset.height))}px)`,
        }}
      >
        {status === 'empty' && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-brand-weak text-brand">
              <ImagePlus className="h-5 w-5" />
            </span>
            <p className="max-w-[26ch] font-display text-[24px] leading-tight text-[#475569]">
              Describe what you see for {brandName}.
            </p>
            <p className="font-mono text-[12px] text-muted-foreground">
              {preset.shortLabel} · {aspectRatioLabel(preset.width, preset.height)} · {preset.width}×{preset.height}
            </p>
          </div>
        )}

        {status === 'generating' && (
          <>
            <div className="absolute inset-0 overflow-hidden bg-card">
              <div className="absolute inset-0 animate-basar-shimmer bg-[linear-gradient(100deg,transparent_20%,color-mix(in_srgb,var(--brand)_14%,white)_42%,white_50%,color-mix(in_srgb,var(--brand)_14%,white)_58%,transparent_80%)]" />
            </div>
            <p className="absolute inset-x-0 bottom-4 text-center text-[12px] text-muted-foreground">
              ✦ Painting your image…
            </p>
          </>
        )}

        {status === 'done' && imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={imageAlt ?? 'Generated image'}
            className="h-full w-full animate-basar-reveal object-cover"
          />
        )}
      </div>
    </div>
  )
}

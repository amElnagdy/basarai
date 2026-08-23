'use client'

import { cn } from '@/lib/utils'
import { aspectRatioLabel, type PresetInfo } from '@/lib/presets'

interface PresetFrameProps {
  preset: PresetInfo
  platform?: string
  selected?: boolean
  disabled?: boolean
  onSelect: () => void
}

export function PresetFrame({ preset, platform, selected, disabled, onSelect }: PresetFrameProps) {
  const landscape = preset.width >= preset.height
  const long = 44
  const frameW = landscape ? long : (long * preset.width) / preset.height
  const frameH = landscape ? (long * preset.height) / preset.width : long

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex min-w-[88px] flex-col items-center gap-1.5 rounded-lg border bg-card px-2.5 pb-2.5 pt-2.5 text-center shadow-xs transition-[border-color,background-color,box-shadow] duration-fast ease-out',
        selected
          ? 'border-brand bg-brand-weaker shadow-[0_0_0_3px_var(--brand-ring)]'
          : 'border-border hover:border-brand-border',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className="flex h-[44px] w-full items-center justify-center">
        <span
          className={cn(
            'rounded-[4px] border-[1.5px]',
            selected ? 'border-brand bg-brand-weak' : 'border-[#CBD5E1] bg-surface-sunken',
          )}
          style={{ width: frameW, height: frameH }}
        />
      </span>
      <span className="text-[13px] font-medium leading-none">{preset.shortLabel}</span>
      {platform && (
        <span className="text-[10px] leading-none text-muted-foreground">{platform}</span>
      )}
      <span className="font-mono text-[10px] text-muted-foreground">
        {aspectRatioLabel(preset.width, preset.height)}
      </span>
    </button>
  )
}

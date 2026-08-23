'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatHex, isKitColor, normalizeHex } from '@/components/brand/brand-workspace'

interface ColorSlotProps {
  value: string
  isPrimary?: boolean
  canRemove?: boolean
  onChange: (hex: string) => void
  onRemove: () => void
  onMakePrimary?: () => void
}

export function ColorSlot({
  value,
  isPrimary,
  canRemove = true,
  onChange,
  onRemove,
  onMakePrimary,
}: ColorSlotProps) {
  const [draft, setDraft] = useState(value)
  const swatch = formatHex(draft)
  const swatchReady = Boolean(normalizeHex(draft))
  const invalid = draft.length > 0 && !isKitColor(draft) && !normalizeHex(draft)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit(raw: string) {
    const hex = normalizeHex(raw)
    if (!hex) {
      onChange(raw)
      return
    }
    const canonical = `#${hex}`
    setDraft(canonical)
    onChange(canonical)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border px-3 py-2',
        isPrimary ? 'border-brand bg-brand-weaker' : 'border-border',
      )}
    >
      <label className="relative h-[42px] w-[42px] shrink-0 cursor-pointer overflow-hidden rounded-md border border-border">
        <span className="absolute inset-0" style={{ background: swatchReady ? swatch : '#CBD5E1' }} />
        <input
          type="color"
          value={swatchReady ? swatch : '#000000'}
          onChange={(e) => {
            const next = e.target.value.toUpperCase()
            setDraft(next)
            onChange(next)
          }}
          aria-label="Color picker"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {isPrimary ? (
          <span className="text-micro font-semibold uppercase tracking-[0.09em] text-brand">
            Primary · the accent
          </span>
        ) : (
          <button
            type="button"
            onClick={onMakePrimary}
            className="w-fit text-left text-[12px] text-muted-foreground hover:text-brand"
          >
            Make primary
          </button>
        )}
        <Input
          type="text"
          value={draft.toUpperCase()}
          onChange={(e) => {
            const next = e.target.value
            setDraft(next)
            onChange(next)
          }}
          onBlur={() => commit(draft)}
          maxLength={7}
          placeholder="#RRGGBB"
          aria-label="Hex color value"
          aria-invalid={invalid}
          className={cn(
            'h-8 w-[116px] font-mono text-[12px] uppercase',
            invalid && 'border-destructive',
          )}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove color"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

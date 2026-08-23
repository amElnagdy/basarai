'use client'

import { Sparkles } from 'lucide-react'
import { BrandDot } from '@/components/brand/brand-dot'
import { BrandWorkspace, BASAR_ACCENT, formatHex, normalizeHex, onBrandTextColor } from '@/components/brand/brand-workspace'
import { ColorSlot } from '@/components/kit/color-slot'
import { KitQuestion } from '@/components/kit/kit-question'
import { Button } from '@/components/ui/button'
import { KitAnswers } from '@/types'

interface StepProps {
  answers: KitAnswers
  onChange: (partial: Partial<KitAnswers>) => void
  brandName: string
}

const CURATED = [
  '#1E6E82', '#0F172A', '#2563EB', '#7C3AED',
  '#DB2777', '#DC2626', '#EA580C', '#CA8A04',
  '#16A34A', '#0D9488', '#0369A1', '#57534E',
]

export function StepColors({ answers, onChange }: StepProps) {
  const colors = answers.colors
  const primary = colors[0] && normalizeHex(colors[0]) ? formatHex(colors[0]) : BASAR_ACCENT

  const handleColorChange = (index: number, hex: string) => {
    const updated = [...colors]
    updated[index] = hex
    onChange({ colors: updated })
  }

  const handleColorRemove = (index: number) => {
    if (colors.length <= 1) return
    onChange({ colors: colors.filter((_, i) => i !== index) })
  }

  const handleAddColor = (hex = '#334155') => {
    if (colors.length >= 3) return
    if (colors.some((c) => normalizeHex(c) === normalizeHex(hex))) return
    onChange({ colors: [...colors, hex] })
  }

  const handleMakePrimary = (index: number) => {
    if (index === 0) return
    const next = [...colors]
    const [picked] = next.splice(index, 1)
    next.unshift(picked)
    onChange({ colors: next })
  }

  return (
    <div className="space-y-6">
      <KitQuestion
        before="Your "
        emphasis="colors"
        after="."
        helper="Up to three. The first one is the accent Basar wears in this workspace."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_244px]">
        <div className="space-y-2">
          {colors.map((color, index) => (
            <ColorSlot
              key={index}
              value={color}
              isPrimary={index === 0}
              canRemove={colors.length > 1}
              onChange={(hex) => handleColorChange(index, hex)}
              onRemove={() => handleColorRemove(index)}
              onMakePrimary={() => handleMakePrimary(index)}
            />
          ))}
          {colors.length === 0 && (
            <p className="text-[13px] text-muted-foreground">Add a color to set the studio accent.</p>
          )}
          <button
            type="button"
            onClick={() => handleAddColor()}
            disabled={colors.length >= 3}
            className="mt-2 w-full rounded-md border border-dashed border-border px-3 py-2 text-[13px] text-muted-foreground hover:border-brand hover:text-brand disabled:opacity-50"
          >
            Add color
          </button>
          <div className="grid grid-cols-6 gap-2 pt-2">
            {CURATED.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                onClick={() => {
                  if (colors.length === 0) onChange({ colors: [hex] })
                  else handleAddColor(hex)
                }}
                className="h-8 rounded-md border border-border"
                style={{ background: hex }}
              />
            ))}
          </div>
        </div>

        <BrandWorkspace color={primary} syncRoot={false}>
          <div className="rounded-lg border border-border bg-card p-[18px] shadow-xs">
            <p className="text-micro font-semibold uppercase tracking-[0.09em] text-muted-foreground">
              Live preview
            </p>
            <div className="mt-4 flex flex-col items-start gap-3">
              <Button size="sm">
                <Sparkles className="h-3.5 w-3.5" />
                Generate
              </Button>
              <BrandDot color={primary} selected />
              <div className="h-1 w-full overflow-hidden rounded-full bg-brand-weak">
                <div className="h-full w-2/3 rounded-full bg-brand" />
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                {primary} · text {onBrandTextColor(primary) === '#FFFFFF' ? 'white' : 'ink'}
              </p>
            </div>
          </div>
        </BrandWorkspace>
      </div>
    </div>
  )
}

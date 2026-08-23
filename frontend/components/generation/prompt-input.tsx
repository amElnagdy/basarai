'use client'

import { Eyebrow } from '@/components/ui/eyebrow'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const MAX = 4000

export function PromptInput({ value, onChange, disabled }: PromptInputProps) {
  const length = value.length
  const tooLong = length > MAX

  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>Prompt</Eyebrow>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Describe the image…"
          className="min-h-[128px] pb-7 text-[15px] leading-[1.5]"
          maxLength={MAX + 200}
        />
        <span
          className={cn(
            'pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] tabular-nums text-muted-foreground',
            tooLong && 'text-destructive',
          )}
        >
          {length} / {MAX}
        </span>
      </div>
    </div>
  )
}

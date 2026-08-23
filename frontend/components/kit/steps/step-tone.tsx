'use client'

import { KitQuestion } from '@/components/kit/kit-question'
import { cn } from '@/lib/utils'
import { KitAnswers, ToneOption } from '@/types'

interface StepProps {
  answers: KitAnswers
  onChange: (partial: Partial<KitAnswers>) => void
  brandName: string
}

const TONE_OPTIONS: { value: ToneOption; label: string; descriptor: string }[] = [
  { value: 'formal', label: 'Formal', descriptor: 'Reserved, precise, a little distant.' },
  { value: 'casual', label: 'Casual', descriptor: 'Easy, conversational, like a friend.' },
  { value: 'playful', label: 'Playful', descriptor: 'Light on its feet, a wink in the copy.' },
  { value: 'professional', label: 'Professional', descriptor: 'Clear, competent, no wasted words.' },
  { value: 'friendly', label: 'Friendly', descriptor: 'Warm, open, glad you showed up.' },
]

export function StepTone({ answers, onChange }: StepProps) {
  const selected = TONE_OPTIONS.find((o) => o.value === answers.tone)

  return (
    <div className="space-y-6">
      <KitQuestion
        before="How should it "
        emphasis="sound"
        after="?"
        helper="Pick the voice Basar should paint in."
      />
      <div className="flex flex-wrap gap-3">
        {TONE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange({ tone: option.value })}
            aria-pressed={answers.tone === option.value}
            className={cn(
              'h-10 rounded-md border px-4 text-[13px] font-medium transition-colors duration-fast',
              answers.tone === option.value
                ? 'border-brand bg-brand-weak text-foreground'
                : 'border-border bg-card hover:bg-accent',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-[14px] italic text-muted-foreground">{selected.descriptor}</p>
      )}
    </div>
  )
}

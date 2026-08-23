'use client'

import { KitQuestion } from '@/components/kit/kit-question'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { KitAnswers } from '@/types'

interface StepProps {
  answers: KitAnswers
  onChange: (partial: Partial<KitAnswers>) => void
  brandName: string
}

export function StepTagline({ answers, onChange, brandName }: StepProps) {
  const examples = [
    `${brandName}. Seen clearly.`,
    'Made to be remembered.',
    'Quietly distinctive.',
  ]

  return (
    <div className="space-y-6">
      <KitQuestion
        before="What's "
        emphasis={`${brandName}'s`}
        after=" tagline?"
        helper="Optional. A short line Basar can weave into the image brief."
      />
      <div className="space-y-2">
        <Label htmlFor="kit-tagline">Tagline</Label>
        <Input
          id="kit-tagline"
          type="text"
          value={answers.tagline ?? ''}
          maxLength={160}
          onChange={(e) => onChange({ tagline: e.target.value || null })}
          placeholder="Enter a tagline…"
        />
        <p className="text-[12px] text-muted-foreground">
          {answers.tagline?.length ?? 0}/160
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onChange({ tagline: example })}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-fast',
              answers.tagline === example
                ? 'border-brand bg-brand-weak text-foreground'
                : 'border-border hover:border-brand-border',
            )}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  )
}

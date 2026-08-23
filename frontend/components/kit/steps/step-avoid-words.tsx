'use client'

import { KitQuestion } from '@/components/kit/kit-question'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { KitAnswers } from '@/types'

interface StepProps {
  answers: KitAnswers
  onChange: (partial: Partial<KitAnswers>) => void
  brandName: string
}

export function StepAvoidWords({ answers, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <KitQuestion
        before="Anything to "
        emphasis="avoid"
        after="?"
        helper="Optional. Words or themes Basar should stay away from."
      />
      <div className="space-y-2">
        <Label htmlFor="kit-avoid">Avoid</Label>
        <Textarea
          id="kit-avoid"
          value={answers.avoid_words ?? ''}
          maxLength={500}
          onChange={(e) => onChange({ avoid_words: e.target.value || null })}
          placeholder="Words or themes to avoid…"
          rows={4}
        />
        <p className="text-[12px] text-muted-foreground">
          {answers.avoid_words?.length ?? 0}/500
        </p>
      </div>
    </div>
  )
}

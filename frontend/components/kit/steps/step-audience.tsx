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

export function StepAudience({ answers, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <KitQuestion
        before="Who is it "
        emphasis="for"
        after="?"
        helper="A few sentences on who should feel spoken to."
      />
      <div className="space-y-2">
        <Label htmlFor="kit-audience">Audience</Label>
        <Textarea
          id="kit-audience"
          value={answers.audience ?? ''}
          maxLength={500}
          onChange={(e) => onChange({ audience: e.target.value || null })}
          placeholder="Describe your target audience…"
          rows={4}
        />
        <p className="text-[12px] text-muted-foreground">
          {answers.audience?.length ?? 0}/500
        </p>
      </div>
    </div>
  )
}

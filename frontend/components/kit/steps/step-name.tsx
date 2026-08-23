'use client'

import { KitQuestion } from '@/components/kit/kit-question'
import { KitAnswers } from '@/types'

interface StepProps {
  answers: KitAnswers
  onChange: (partial: Partial<KitAnswers>) => void
  brandName: string
}

export function StepName({ brandName }: StepProps) {
  return (
    <div className="space-y-6">
      <KitQuestion
        before="This is "
        emphasis={brandName}
        after="."
        helper="The name you registered. Continue to tell Basar how it should look and sound."
      />
      <p className="text-[16px] font-semibold">{brandName}</p>
    </div>
  )
}

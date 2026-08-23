'use client'

import type { Provider } from '@/types'
import type { ActiveKeys } from '@/hooks/use-active-keys'
import { NoKeyNotice } from '@/components/generation/no-key-notice'
import { Eyebrow } from '@/components/ui/eyebrow'
import { SegmentedControl } from '@/components/ui/segmented-control'

interface ProviderSelectorProps {
  value: Provider
  onChange: (value: Provider) => void
  activeKeys: ActiveKeys
  brandId: string
  disabled?: boolean
}

export function ProviderSelector({
  value, onChange, activeKeys, brandId, disabled,
}: ProviderSelectorProps) {
  const currentHasKey =
    (value === 'openai' && activeKeys.openaiActive) ||
    (value === 'gemini' && activeKeys.geminiActive)

  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>Provider</Eyebrow>
      <SegmentedControl
        aria-label="Provider"
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={[
          { value: 'openai', label: 'OpenAI' },
          { value: 'gemini', label: 'Gemini' },
        ]}
      />
      {!currentHasKey && <NoKeyNotice provider={value} brandId={brandId} />}
    </div>
  )
}

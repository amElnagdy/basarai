'use client'

import { SegmentedControl } from '@/components/ui/segmented-control'
import { PLATFORM_PRESETS, PRESETS_BY_PLATFORM } from '@/lib/presets'
import type { PlatformPreset } from '@/types'

interface HistoryFiltersProps {
  provider: string | undefined
  status: string | undefined
  preset: string | undefined
  onProviderChange: (value: string | undefined) => void
  onStatusChange: (value: string | undefined) => void
  onPresetChange: (value: string | undefined) => void
}

export function HistoryFilters({
  provider,
  status,
  preset,
  onProviderChange,
  onStatusChange,
  onPresetChange,
}: HistoryFiltersProps) {
  const statusValue = status === 'succeeded' || status === 'failed' ? status : 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SegmentedControl
        aria-label="Status"
        value={statusValue}
        onChange={(v) => onStatusChange(v === 'all' ? undefined : v)}
        options={[
          { value: 'all', label: 'All' },
          { value: 'succeeded', label: 'Succeeded' },
          { value: 'failed', label: 'Failed' },
        ]}
      />
      <label htmlFor="history-provider" className="sr-only">
        Filter by provider
      </label>
      <select
        id="history-provider"
        value={provider ?? ''}
        onChange={(e) => onProviderChange(e.target.value || undefined)}
        className="h-10 rounded-md border border-input bg-background px-3 text-[13px] shadow-xs focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--brand-ring)] focus-visible:outline-none"
      >
        <option value="">All providers</option>
        <option value="openai">OpenAI</option>
        <option value="gemini">Gemini</option>
      </select>
      <label htmlFor="history-preset" className="sr-only">
        Filter by preset
      </label>
      <select
        id="history-preset"
        value={preset ?? ''}
        onChange={(e) => onPresetChange(e.target.value || undefined)}
        className="h-10 rounded-md border border-input bg-background px-3 text-[13px] shadow-xs focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--brand-ring)] focus-visible:outline-none"
      >
        <option value="">All presets</option>
        {Object.entries(PRESETS_BY_PLATFORM).map(([platform, presets]) => (
          <optgroup key={platform} label={platform}>
            {presets.map((id) => (
              <option key={id} value={id}>
                {PLATFORM_PRESETS[id as PlatformPreset].label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

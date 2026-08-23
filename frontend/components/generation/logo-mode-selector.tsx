'use client'

import type { LogoMode } from '@/types'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Notice } from '@/components/ui/notice'
import { SegmentedControl } from '@/components/ui/segmented-control'
import Link from 'next/link'

interface LogoModeSelectorProps {
  value: LogoMode
  onChange: (value: LogoMode) => void
  brandHasLogo: boolean
  brandId?: string
  disabled?: boolean
}

export function LogoModeSelector({
  value, onChange, brandHasLogo, brandId, disabled,
}: LogoModeSelectorProps) {
  const noLogoTitle = 'Upload a logo in Settings'

  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>Logo</Eyebrow>
      <SegmentedControl
        aria-label="Logo mode"
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={[
          { value: 'none', label: 'None' },
          { value: 'prompt', label: 'In prompt' },
          {
            value: 'watermark',
            label: 'Mark',
            disabled: !brandHasLogo,
            title: brandHasLogo ? undefined : noLogoTitle,
          },
          {
            value: 'both',
            label: 'Both',
            disabled: !brandHasLogo,
            title: brandHasLogo ? undefined : noLogoTitle,
          },
        ]}
      />
      {!brandHasLogo && (
        <Notice variant="info">
          Watermark modes need a brand logo. Add one in{' '}
          {brandId ? (
            <Link href={`/${brandId}/settings`} className="font-medium text-brand underline underline-offset-2">
              Settings
            </Link>
          ) : (
            <strong>Settings</strong>
          )}
          .
        </Notice>
      )}
    </div>
  )
}

'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { BASAR_ACCENT, onBrandTextColor, normalizeHex } from '@/components/brand/brand-workspace'

interface BrandDotProps {
  color?: string | null
  logoUrl?: string | null
  name?: string
  size?: number
  selected?: boolean
  className?: string
}

export function BrandDot({
  color,
  logoUrl,
  name,
  size = 26,
  selected = false,
  className,
}: BrandDotProps) {
  const normalized = normalizeHex(color ?? '')
  const fill = normalized ? `#${normalized}` : BASAR_ACCENT
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-[box-shadow,transform] duration-fast ease-out',
        selected && 'shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_4px_var(--brand)]',
        className,
      )}
      style={
        {
          width: size,
          height: size,
          background: fill,
          '--brand': fill,
          '--on-brand': onBrandTextColor(fill),
        } as CSSProperties
      }
      aria-hidden={name ? undefined : true}
      title={name}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : null}
    </span>
  )
}

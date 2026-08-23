/**
 * The app wears the brand. One wrapper sets --brand / --on-brand from
 * kit colors[0]; descendants re-mix hover, ring, and weak fills.
 *
 * Accent only — never paint a large surface or body copy with the raw hex.
 */
import * as React from 'react'

/** Basar's own default accent (petrol) when a brand has no kit color yet. */
export const BASAR_ACCENT = '#1E6E82'

/**
 * Readable text color for a solid `--brand` fill, by WCAG relative luminance.
 */
export function onBrandTextColor(hex: string): string {
  const c = normalizeHex(hex)
  if (!c) return '#FFFFFF'
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  const r = toLinear(parseInt(c.slice(0, 2), 16) / 255)
  const g = toLinear(parseInt(c.slice(2, 4), 16) / 255)
  const b = toLinear(parseInt(c.slice(4, 6), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.5 ? '#0B1220' : '#FFFFFF'
}

/** Accepts #abc / #aabbcc / aabbcc. Returns 6 hex chars, or null if invalid. */
export function normalizeHex(input: string): string | null {
  if (!input) return null
  let c = input.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(c)) c = c.split('').map((x) => x + x).join('')
  return /^[0-9a-f]{6}$/i.test(c) ? c.toUpperCase() : null
}

export function formatHex(input: string): string {
  const c = normalizeHex(input)
  return c ? `#${c}` : input
}

export interface BrandWorkspaceProps {
  color?: string | null
  className?: string
  children: React.ReactNode
}

export function BrandWorkspace({ color, className, children }: BrandWorkspaceProps) {
  const normalized = normalizeHex(color ?? '')
  const brand = normalized ? `#${normalized}` : BASAR_ACCENT
  return (
    <div
      className={className}
      style={
        {
          '--brand': brand,
          '--on-brand': onBrandTextColor(brand),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}

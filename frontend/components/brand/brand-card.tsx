'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { BrandListItem } from '@/types'
import { BrandDot } from '@/components/brand/brand-dot'
import { KitStatusBadge } from '@/components/kit/kit-status-badge'
import { Badge } from '@/components/ui/badge'
import { useBrands } from '@/hooks/use-brands'
import { useParams } from 'next/navigation'

interface BrandCardProps {
  brand: BrandListItem
}

export function BrandCard({ brand }: BrandCardProps) {
  const params = useParams()
  const { accents } = useBrands()
  const current = params.brandId === brand.id
  const accent = accents[brand.id]

  return (
    <Link
      href={`/${brand.id}`}
      className="flex items-center gap-4 rounded-lg border bg-card p-[18px] no-underline shadow-xs transition-shadow duration-fast hover:shadow-md"
    >
      <BrandDot color={accent} logoUrl={brand.logo_url} name={brand.name} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[16px] font-semibold">{brand.name}</h3>
          {current && <Badge>Current</Badge>}
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Created {new Date(brand.created_at).toLocaleDateString()}
        </p>
      </div>
      <KitStatusBadge status={brand.kit_status} />
      {accent && (
        <span className="hidden font-mono text-[12px] text-muted-foreground sm:inline">
          {accent}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

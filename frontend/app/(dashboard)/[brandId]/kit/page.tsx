'use client'

import { useParams } from 'next/navigation'
import { useKit } from '@/hooks/use-kit'
import { KitWizard } from '@/components/kit/kit-wizard'

export default function KitPage() {
  const params = useParams()
  const brandId = Array.isArray(params.brandId) ? params.brandId[0] : params.brandId ?? ''
  const { kit, loading, error } = useKit(brandId)

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  if (error || !kit) {
    return <p className="text-destructive">Failed to load brand kit.</p>
  }

  return <KitWizard brandId={brandId} brandName={kit.brand_name} initialKit={kit} />
}

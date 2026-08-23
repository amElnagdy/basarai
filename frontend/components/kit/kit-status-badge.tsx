import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { KitStatus } from '@/types'

const LABELS: Record<KitStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
}

const VARIANTS: Record<KitStatus, 'muted' | 'warning' | 'success'> = {
  not_started: 'muted',
  in_progress: 'warning',
  complete: 'success',
}

export function KitStatusBadge({
  status,
  brandId,
}: {
  status: KitStatus
  brandId?: string
}) {
  const badge = (
    <Badge
      variant={VARIANTS[status]}
      aria-label={`Brand kit status: ${LABELS[status]}`}
    >
      {LABELS[status]}
    </Badge>
  )

  if (!brandId) return badge

  return (
    <Link
      href={`/${brandId}/kit`}
      className="no-underline"
      aria-label={`Brand kit status: ${LABELS[status]}. Click to edit.`}
    >
      {badge}
    </Link>
  )
}

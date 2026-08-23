import Link from 'next/link'
import type { Provider } from '@/types'
import { Notice } from '@/components/ui/notice'

interface NoKeyNoticeProps {
  provider: Provider
  brandId: string
}

export function NoKeyNotice({ provider, brandId }: NoKeyNoticeProps) {
  const label = provider === 'openai' ? 'OpenAI' : 'Gemini'
  return (
    <Notice variant="warning">
      No {label} key yet —{' '}
      <Link
        href={`/${brandId}/keys`}
        className="font-medium underline underline-offset-2"
      >
        Add one
      </Link>{' '}
      to generate with this provider.
    </Notice>
  )
}

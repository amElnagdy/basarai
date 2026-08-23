import Link from 'next/link'
import { Notice } from '@/components/ui/notice'

interface ErrorMessageProps {
  code: string
  message: string
  brandId: string
}

export function ErrorMessage({ code, message, brandId }: ErrorMessageProps) {
  return (
    <Notice variant="danger">
      {message}{' '}
      {code === 'INVALID_KEY' && (
        <Link
          href={`/${brandId}/keys`}
          className="font-medium underline underline-offset-2"
        >
          Review your keys
        </Link>
      )}
    </Notice>
  )
}

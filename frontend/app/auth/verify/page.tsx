'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useClerk } from '@clerk/nextjs'
import { EmailLinkErrorCodeStatus, isEmailLinkError } from '@clerk/nextjs/errors'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ImagePlus, KeyRound, Palette } from 'lucide-react'

type VerifyStatus = 'loading' | 'verified' | 'expired' | 'client_mismatch' | 'failed'

export default function VerifyEmailLinkPage() {
  const [status, setStatus] = useState<VerifyStatus>('loading')
  const { handleEmailLinkVerification, loaded } = useClerk()

  useEffect(() => {
    if (!loaded) return

    let cancelled = false

    async function verify() {
      try {
        await handleEmailLinkVerification({
          redirectUrlComplete: '/brands',
        })
        if (!cancelled) setStatus('verified')
      } catch (err: unknown) {
        let next: VerifyStatus = 'failed'
        if (err instanceof Error && isEmailLinkError(err)) {
          if (err.code === EmailLinkErrorCodeStatus.Expired) {
            next = 'expired'
          } else if (err.code === EmailLinkErrorCodeStatus.ClientMismatch) {
            next = 'client_mismatch'
          }
        }
        if (!cancelled) setStatus(next)
      }
    }

    void verify()
    return () => {
      cancelled = true
    }
  }, [handleEmailLinkVerification, loaded])

  const copy = {
    loading: {
      title: 'Verifying your email',
      description: 'Hang on while we confirm that link.',
    },
    verified: {
      title: 'You are signed in',
      description: 'Continue to your studio, or close this tab if you already have one open.',
    },
    expired: {
      title: 'This link has expired',
      description: 'Request a new sign-in or sign-up link and try again.',
    },
    client_mismatch: {
      title: 'Open this on the original tab',
      description:
        'Email links only work on the same device and browser you started from. Go back to that tab, or request a new link there.',
    },
    failed: {
      title: 'We could not verify that link',
      description: 'Request a new link from the login page and try again.',
    },
  }[status]

  return (
    <AuthShell
      hero={
        <>
          Almost <em className="text-[#6FB2C0]">there.</em>
        </>
      }
      subcopy="Basar remembers your brand — kit, colors, tone — and hands back platform-ready images."
      features={[
        { icon: Palette, label: 'Your kit, colors, and tone — remembered' },
        { icon: ImagePlus, label: 'Every image, sized for the platform' },
        { icon: KeyRound, label: 'Bring your own OpenAI or Gemini key' },
      ]}
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-[22px] font-semibold tracking-tight">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        {status !== 'loading' && (
          <>
            <CardFooter>
              <Button asChild size="lg" className="w-full">
                <Link href={status === 'verified' ? '/brands' : '/login'}>
                  {status === 'verified' ? 'Go to your studio' : 'Back to login'}
                </Link>
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </AuthShell>
  )
}

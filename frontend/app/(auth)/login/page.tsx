'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Eye, EyeOff, ImagePlus, KeyRound, Palette } from 'lucide-react'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { useSignIn } from '@clerk/nextjs'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type LoginMethod = 'password' | 'link'

function clerkMessage(err: unknown): string {
  if (isClerkAPIResponseError(err) && err.errors[0]?.longMessage) {
    return err.errors[0].longMessage
  }
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [method, setMethod] = useState<LoginMethod>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingInbox, setCheckingInbox] = useState(false)
  const cancelFlowRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      cancelFlowRef.current?.()
    }
  }, [])

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isLoaded || !signIn || !setActive) return
    setLoading(true)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
        strategy: 'password',
      })
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        router.push('/brands')
        router.refresh()
        return
      }
      setError('Unable to complete sign-in. Please try again.')
    } catch (err) {
      setError(clerkMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isLoaded || !signIn || !setActive) return
    setLoading(true)
    cancelFlowRef.current?.()

    try {
      const { startEmailLinkFlow, cancelEmailLinkFlow } = signIn.createEmailLinkFlow()
      cancelFlowRef.current = cancelEmailLinkFlow

      const created = await signIn.create({ identifier: email })
      const emailLinkFactor = created.supportedFirstFactors?.find(
        (factor): factor is Extract<typeof factor, { strategy: 'email_link' }> =>
          factor.strategy === 'email_link',
      )
      if (!emailLinkFactor) {
        setError('Email link sign-in is not available for this account.')
        setLoading(false)
        return
      }

      setCheckingInbox(true)
      setLoading(false)

      const attempt = await startEmailLinkFlow({
        emailAddressId: emailLinkFactor.emailAddressId,
        redirectUrl: `${window.location.origin}/auth/verify`,
      })

      if (
        attempt.firstFactorVerification.status === 'verified' &&
        attempt.status === 'complete' &&
        attempt.createdSessionId
      ) {
        await setActive({ session: attempt.createdSessionId })
        router.push('/brands')
        router.refresh()
        return
      }

      if (attempt.firstFactorVerification.status === 'expired') {
        setCheckingInbox(false)
        setError('The email link has expired. Request a new one.')
        return
      }

      setCheckingInbox(false)
      setError('Unable to complete sign-in. Please try again.')
    } catch (err) {
      setCheckingInbox(false)
      setError(clerkMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      hero={
        <>
          Walk into <em className="text-[#6FB2C0]">your own studio.</em>
        </>
      }
      subcopy="Basar remembers your brand — kit, colors, tone — and hands back platform-ready images."
      features={[
        { icon: Palette, label: 'Your kit, colors, and tone — remembered' },
        { icon: ImagePlus, label: 'Every image, sized for the platform' },
        { icon: KeyRound, label: 'Bring your own OpenAI or Gemini key' },
      ]}
    >
      {checkingInbox ? (
        <Card className="shadow-sm">
          <CardHeader className="items-center text-center">
            <span className="mb-2 inline-flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[color-mix(in_srgb,hsl(var(--success))_14%,white)] text-success">
              <Check className="h-5 w-5" />
            </span>
            <CardTitle className="text-[22px] font-semibold tracking-tight">Check your inbox</CardTitle>
            <CardDescription>
              We sent a sign-in link to <strong className="text-foreground">{email}</strong>. Open
              it in this browser to continue.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[22px] font-semibold tracking-tight">Log in</CardTitle>
            <CardDescription>
              Enter your email and password, or have us email you a link.
            </CardDescription>
          </CardHeader>
          <form onSubmit={method === 'password' ? handlePassword : handleMagicLink}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-[color-mix(in_srgb,hsl(var(--destructive))_8%,white)] p-3 text-[13px] text-destructive">
                  {error}
                </div>
              )}
              <SegmentedControl
                aria-label="Sign-in method"
                className="w-full"
                value={method}
                onChange={setMethod}
                options={[
                  { value: 'password', label: 'Password' },
                  { value: 'link', label: 'Email me a link' },
                ]}
              />
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              {method === 'password' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" size="lg" className="w-full" disabled={loading || !isLoaded}>
                {loading
                  ? method === 'password'
                    ? 'Logging in…'
                    : 'Sending link…'
                  : method === 'password'
                    ? 'Log in'
                    : 'Email me a link'}
              </Button>
              <p className="text-center text-[12px] text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-brand underline underline-offset-[2px]">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      )}
    </AuthShell>
  )
}

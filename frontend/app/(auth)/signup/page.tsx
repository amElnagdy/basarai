'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, ImagePlus, KeyRound, Palette } from 'lucide-react'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { useSignUp } from '@clerk/nextjs'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function clerkMessage(err: unknown): string {
  if (isClerkAPIResponseError(err) && err.errors[0]?.longMessage) {
    return err.errors[0].longMessage
  }
  return 'Something went wrong. Please try again.'
}

export default function SignUpPage() {
  const router = useRouter()
  const { isLoaded, signUp, setActive } = useSignUp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const cancelFlowRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      cancelFlowRef.current?.()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isLoaded || !signUp || !setActive) return
    setLoading(true)
    cancelFlowRef.current?.()

    try {
      await signUp.create({
        emailAddress: email,
        password,
      })

      const { startEmailLinkFlow, cancelEmailLinkFlow } = signUp.createEmailLinkFlow()
      cancelFlowRef.current = cancelEmailLinkFlow

      setSuccess(true)
      setLoading(false)

      const attempt = await startEmailLinkFlow({
        redirectUrl: `${window.location.origin}/auth/verify`,
      })

      if (
        attempt.verifications.emailAddress.status === 'verified' &&
        attempt.status === 'complete' &&
        attempt.createdSessionId
      ) {
        await setActive({ session: attempt.createdSessionId })
        router.push('/brands')
        router.refresh()
      }
    } catch (err) {
      setSuccess(false)
      setError(clerkMessage(err))
      setLoading(false)
    }
  }

  const hero = success ? (
    <>
      Your studio is <em className="text-[#6FB2C0]">almost open.</em>
    </>
  ) : (
    <>
      Give your brand <em className="text-[#6FB2C0]">vision.</em>
    </>
  )

  return (
    <AuthShell
      hero={hero}
      subcopy="One warm interview, your own keys, and every asset sized for the platform."
      features={[
        { icon: Palette, label: 'One warm interview, then you’re set' },
        { icon: KeyRound, label: 'Bring your own OpenAI or Gemini key' },
        { icon: ImagePlus, label: 'Every preset, sized correctly' },
      ]}
    >
      {success ? (
        <Card className="shadow-sm">
          <CardHeader className="items-center text-center">
            <span className="mb-2 inline-flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[color-mix(in_srgb,hsl(var(--success))_14%,white)] text-success">
              <Check className="h-5 w-5" />
            </span>
            <CardTitle className="text-[22px] font-semibold tracking-tight">Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Open
              it in this browser to activate your account.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="secondary" size="lg" className="w-full">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[22px] font-semibold tracking-tight">Create an account</CardTitle>
            <CardDescription>
              Enter your email and password to get started.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-[color-mix(in_srgb,hsl(var(--destructive))_8%,white)] p-3 text-[13px] text-destructive">
                  {error}
                </div>
              )}
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
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <p className="text-[12px] text-muted-foreground">At least 8 characters.</p>
              </div>
              <div id="clerk-captcha" />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" size="lg" className="w-full" disabled={loading || !isLoaded}>
                {loading ? 'Creating account…' : 'Sign up'}
              </Button>
              <p className="text-center text-[12px] text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-brand underline underline-offset-[2px]">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      )}
    </AuthShell>
  )
}

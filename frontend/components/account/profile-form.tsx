'use client'

import { useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface ProfileFormProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

export function ProfileForm({ profile, onUpdate }: ProfileFormProps) {
  const { toast } = useToast()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ full_name?: string; avatar_url?: string }>({})

  function validate(): boolean {
    const newErrors: typeof errors = {}

    if (fullName.trim() && (fullName.trim().length < 2 || fullName.trim().length > 120)) {
      newErrors.full_name = 'Full name must be between 2 and 120 characters'
    }

    if (avatarUrl.trim() && !/^https?:\/\/.+/.test(avatarUrl.trim())) {
      newErrors.avatar_url = 'Must be a valid HTTP or HTTPS URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const updated = await apiRequest<Profile>('/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        }),
      })
      onUpdate(updated)
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[16px]">Profile</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
            <p className="text-[12px] text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
            {errors.full_name && (
              <p className="text-[13px] text-destructive">{errors.full_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
            {errors.avatar_url && (
              <p className="text-[13px] text-destructive">{errors.avatar_url}</p>
            )}
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}

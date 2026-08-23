'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { ProviderKey } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AddKeyModalProps {
  brandId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onKeyAdded: () => void
  defaultProvider?: string
}

export function AddKeyModal({
  brandId,
  open,
  onOpenChange,
  onKeyAdded,
  defaultProvider,
}: AddKeyModalProps) {
  const [provider, setProvider] = useState<'openai' | 'gemini'>(
    defaultProvider === 'openai' || defaultProvider === 'gemini' ? defaultProvider : 'openai'
  )
  const [key, setKey] = useState('')
  const [label, setLabel] = useState('')
  const [makeActive, setMakeActive] = useState(true)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (defaultProvider === 'openai' || defaultProvider === 'gemini') {
      setProvider(defaultProvider)
    }
  }, [open, defaultProvider])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setKey('')
      setLabel('')
      setMakeActive(true)
      setShowKey(false)
      setError(null)
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await apiRequest<ProviderKey>(`/brands/${brandId}/keys`, {
        method: 'POST',
        body: JSON.stringify({
          provider,
          key: key.trim(),
          label: label.trim() || null,
          make_active: makeActive,
        }),
      })
      onKeyAdded()
      handleOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Add API key</DialogTitle>
          <DialogDescription>
            Add a key for an image provider. It is stored securely and never shown again.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <SegmentedControl
              value={provider}
              onChange={setProvider}
              options={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'gemini', label: 'Gemini' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-…' : 'AI…'}
                required
                className="pr-10 font-mono text-[13px]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="key-label">Label (optional)</Label>
            <Input
              id="key-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Production key"
              maxLength={100}
            />
          </div>

          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={makeActive}
              onChange={(e) => setMakeActive(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-[var(--brand)]"
            />
            Set as active key for this provider
          </label>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !key.trim()}>
              {loading ? 'Adding…' : 'Add key'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

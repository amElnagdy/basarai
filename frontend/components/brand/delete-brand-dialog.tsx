'use client'

import { useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Brand } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteBrandDialogProps {
  brand: Brand
  open: boolean
  onOpenChange: (open: boolean) => void
  onBrandDeleted: () => void
}

export function DeleteBrandDialog({
  brand,
  open,
  onOpenChange,
  onBrandDeleted,
}: DeleteBrandDialogProps) {
  const [confirmName, setConfirmName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = confirmName === brand.name && !loading

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      await apiRequest(`/brands/${brand.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirm_name: confirmName }),
      })
      onBrandDeleted()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete brand')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmName('')
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete {brand.name}?</DialogTitle>
          <DialogDescription>
            This removes the brand, its kit, keys, and history. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div>
          <p className="text-[13px]">
            Type <strong>&quot;{brand.name}&quot;</strong> to confirm:
          </p>
          <Input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Type brand name to confirm"
            className="mt-2"
          />
          {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            {loading ? 'Deleting…' : 'Delete brand'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useBrand } from '@/hooks/use-brand'
import { useBrands } from '@/hooks/use-brands'
import { apiRequest } from '@/lib/api'
import { DeleteBrandDialog } from '@/components/brand/delete-brand-dialog'
import { BrandDot } from '@/components/brand/brand-dot'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Brand, LogoUploadResponse } from '@/types'

export default function BrandSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = Array.isArray(params.brandId) ? params.brandId[0] : params.brandId ?? ''
  const { brand, loading, error, mutate } = useBrand(brandId)
  const { updateBrand, removeBrand, accents } = useBrands()

  const [newName, setNewName] = useState('')
  const [renameLoading, setRenameLoading] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [renameSuccess, setRenameSuccess] = useState(false)
  const nameDirty = useRef(false)

  const [logoLoading, setLogoLoading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (brand && !nameDirty.current) {
      setNewName(brand.name)
    }
  }, [brand])

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  if (error || !brand) {
    return <p className="text-destructive">Failed to load brand settings.</p>
  }

  const handleRename = async () => {
    setRenameLoading(true)
    setRenameError(null)
    setRenameSuccess(false)
    try {
      const updated = await apiRequest<Brand>(`/brands/${brandId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName.trim() }),
      })
      mutate(updated)
      updateBrand(updated)
      nameDirty.current = false
      setRenameSuccess(true)
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Failed to rename brand')
    } finally {
      setRenameLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoLoading(true)
    setLogoError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await apiRequest<LogoUploadResponse>(
        `/brands/${brandId}/logo`,
        { method: 'POST', body: formData }
      )
      const updatedBrand = { ...brand, logo_url: result.logo_url }
      mutate(updatedBrand)
      updateBrand(updatedBrand)
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setLogoLoading(false)
      e.target.value = ''
    }
  }

  const handleLogoRemove = async () => {
    setLogoLoading(true)
    setLogoError(null)
    try {
      await apiRequest(`/brands/${brandId}/logo`, { method: 'DELETE' })
      const updatedBrand = { ...brand, logo_url: null }
      mutate(updatedBrand)
      updateBrand(updatedBrand)
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Failed to remove logo')
    } finally {
      setLogoLoading(false)
    }
  }

  const handleBrandDeleted = () => {
    removeBrand(brandId)
    router.push('/brands')
  }

  return (
    <div className="mx-auto max-w-[620px] space-y-6">
      <h1 className="text-[30px] font-semibold leading-[1.16] tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Brand name</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                nameDirty.current = true
                setRenameSuccess(false)
              }}
            />
            <Button
              type="button"
              onClick={handleRename}
              disabled={renameLoading || !newName.trim()}
            >
              {renameLoading ? 'Saving…' : 'Save'}
            </Button>
          </div>
          {renameError && <p className="text-[13px] text-destructive">{renameError}</p>}
          {renameSuccess && <p className="text-[13px] text-success">Name updated.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Brand logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <BrandDot
              color={accents[brandId]}
              logoUrl={brand.logo_url}
              name={brand.name}
              size={64}
            />
            <div className="flex flex-col gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-secondary px-3.5 text-[13px] font-medium text-secondary-foreground shadow-xs hover:bg-secondary/80">
                  <Upload className="h-4 w-4" />
                  {logoLoading ? 'Uploading…' : 'Upload logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    disabled={logoLoading}
                    className="hidden"
                  />
                </label>
              {brand.logo_url && (
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  disabled={logoLoading}
                  className="text-left text-[13px] text-destructive hover:underline disabled:opacity-50"
                >
                  Remove logo
                </button>
              )}
              <p className="text-[12px] text-muted-foreground">
                PNG, JPG or WebP. Used for watermarks.
              </p>
            </div>
          </div>
          {logoError && <p className="mt-2 text-[13px] text-destructive">{logoError}</p>}
        </CardContent>
      </Card>

      <Card className="border-[color-mix(in_srgb,hsl(var(--destructive))_35%,hsl(var(--border)))]">
        <CardHeader>
          <CardTitle className="text-[16px] text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-muted-foreground">
            Permanently delete this brand and all associated data.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="mt-4"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete brand
          </Button>
        </CardContent>
      </Card>

      <DeleteBrandDialog
        brand={brand}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onBrandDeleted={handleBrandDeleted}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useBrands } from '@/hooks/use-brands'
import { CreateBrandModal } from '@/components/brand/create-brand-modal'
import { BrandCard } from '@/components/brand/brand-card'
import { Button } from '@/components/ui/button'
import { Brand } from '@/types'

export default function BrandsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { brands, loading, error, addBrand } = useBrands()
  const router = useRouter()

  const handleBrandCreated = (brand: Brand) => {
    addBrand(brand)
    router.push(`/${brand.id}`)
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-[1.16] tracking-tight">Brands</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {brands.length} {brands.length === 1 ? 'studio' : 'studios'}. Each one remembers its own kit, keys, and history.
          </p>
        </div>
        <Button type="button" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Create brand
        </Button>
      </div>

      {loading && <p className="mt-4 text-muted-foreground">Loading…</p>}

      {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}

      {!loading && !error && brands.length === 0 && (
        <div className="mt-12 text-center">
          <p className="font-display text-[24px] text-muted-foreground">No studios yet.</p>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Create your first brand to walk into the studio.
          </p>
          <Button type="button" className="mt-6" onClick={() => setShowCreateModal(true)}>
            Create brand
          </Button>
        </div>
      )}

      {!loading && brands.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}

      <CreateBrandModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onBrandCreated={handleBrandCreated}
      />
    </div>
  )
}

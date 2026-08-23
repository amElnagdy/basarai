'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiRequest } from '@/lib/api'
import { Brand, BrandKit, BrandListItem } from '@/types'
import { normalizeHex } from '@/components/brand/brand-workspace'

type BrandSummaryUpdate = Partial<Omit<BrandListItem, 'id'>> & { id: string }

interface BrandsContextValue {
  brands: BrandListItem[]
  loading: boolean
  error: string | null
  accents: Record<string, string>
  refetchBrands: () => Promise<void>
  addBrand: (brand: Brand | BrandListItem) => void
  updateBrand: (brand: Brand | BrandListItem | BrandSummaryUpdate) => void
  removeBrand: (brandId: string) => void
  setAccent: (brandId: string, color: string | null) => void
}

const BrandsContext = createContext<BrandsContextValue | undefined>(undefined)

function toBrandListItem(brand: Brand | BrandListItem): BrandListItem {
  return {
    id: brand.id,
    name: brand.name,
    logo_url: brand.logo_url,
    kit_status: brand.kit_status,
    created_at: brand.created_at,
  }
}

function colorFromKit(kit: BrandKit): string | null {
  const raw = kit.answers.colors?.[0]
  const hex = raw ? normalizeHex(raw) : null
  return hex ? `#${hex}` : null
}

export function BrandsProvider({ children }: { children: React.ReactNode }) {
  const [brands, setBrands] = useState<BrandListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accents, setAccents] = useState<Record<string, string>>({})

  const loadAccents = useCallback(async (items: BrandListItem[]) => {
    const entries = await Promise.all(
      items.map(async (brand) => {
        try {
          const kit = await apiRequest<BrandKit>(`/brands/${brand.id}/kit`)
          const color = colorFromKit(kit)
          return color ? ([brand.id, color] as const) : null
        } catch {
          return null
        }
      }),
    )
    const next: Record<string, string> = {}
    for (const entry of entries) {
      if (entry) next[entry[0]] = entry[1]
    }
    setAccents(next)
  }, [])

  const refetchBrands = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest<BrandListItem[]>('/brands')
      const items = data ?? []
      setBrands(items)
      void loadAccents(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands')
    } finally {
      setLoading(false)
    }
  }, [loadAccents])

  useEffect(() => {
    refetchBrands()
  }, [refetchBrands])

  const addBrand = useCallback((brand: Brand | BrandListItem) => {
    const nextBrand = toBrandListItem(brand)
    setBrands((currentBrands) => {
      const existingBrand = currentBrands.find((item) => item.id === nextBrand.id)
      if (existingBrand) {
        return currentBrands.map((item) =>
          item.id === nextBrand.id ? { ...item, ...nextBrand } : item
        )
      }

      return [nextBrand, ...currentBrands]
    })
  }, [])

  const updateBrand = useCallback(
    (brand: Brand | BrandListItem | BrandSummaryUpdate) => {
      setBrands((currentBrands) =>
        currentBrands.map((item) => {
          if (item.id !== brand.id) {
            return item
          }

          if ('updated_at' in brand) {
            return { ...item, ...toBrandListItem(brand) }
          }

          return { ...item, ...brand }
        })
      )
    },
    []
  )

  const removeBrand = useCallback((brandId: string) => {
    setBrands((currentBrands) => currentBrands.filter((brand) => brand.id !== brandId))
    setAccents((current) => {
      const next = { ...current }
      delete next[brandId]
      return next
    })
  }, [])

  const setAccent = useCallback((brandId: string, color: string | null) => {
    const hex = color ? normalizeHex(color) : null
    setAccents((current) => {
      if (!hex) {
        const next = { ...current }
        delete next[brandId]
        return next
      }
      return { ...current, [brandId]: `#${hex}` }
    })
  }, [])

  const value = useMemo(
    () => ({
      brands,
      loading,
      error,
      accents,
      refetchBrands,
      addBrand,
      updateBrand,
      removeBrand,
      setAccent,
    }),
    [accents, addBrand, brands, error, loading, refetchBrands, removeBrand, setAccent, updateBrand]
  )

  return <BrandsContext.Provider value={value}>{children}</BrandsContext.Provider>
}

export function useBrandsContext() {
  const context = useContext(BrandsContext)

  if (!context) {
    throw new Error('useBrandsContext must be used within a BrandsProvider')
  }

  return context
}

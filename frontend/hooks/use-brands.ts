'use client'

import { useBrandsContext } from '@/components/providers/brands-provider'

export function useBrands() {
  const {
    brands,
    loading,
    error,
    accents,
    refetchBrands,
    addBrand,
    updateBrand,
    removeBrand,
    setAccent,
  } = useBrandsContext()

  return {
    brands,
    loading,
    error,
    accents,
    refetch: refetchBrands,
    addBrand,
    updateBrand,
    removeBrand,
    setAccent,
  }
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '@/lib/api'
import type { AdminBrandListItem, AdminBrandsPage } from '@/types'

interface UseAdminBrandsResult {
  items: AdminBrandListItem[]
  page: number
  perPage: number
  total: number
  loading: boolean
  error: string | null
  hasNext: boolean
  hasPrev: boolean
  nextPage: () => void
  prevPage: () => void
  setPage: (page: number) => void
}

export function useAdminBrands(perPage = 24): UseAdminBrandsResult {
  const [items, setItems] = useState<AdminBrandListItem[]>([])
  const [page, setPageState] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  const requestPage = useCallback(
    (requestedPage: number) => {
      const params = new URLSearchParams({
        page: String(requestedPage),
        per_page: String(perPage),
      })
      return apiRequest<AdminBrandsPage>(`/admin/brands?${params.toString()}`)
    },
    [perPage],
  )

  useEffect(() => {
    const fetchId = ++fetchIdRef.current

    async function fetchBrands() {
      try {
        setLoading(true)
        setError(null)

        const data = await requestPage(page)

        if (fetchIdRef.current !== fetchId) return

        setItems(data.items)
        setTotal(data.total)
      } catch (err) {
        if (fetchIdRef.current !== fetchId) return
        setError(err instanceof Error ? err.message : 'Failed to load admin brands')
      } finally {
        if (fetchIdRef.current === fetchId) {
          setLoading(false)
        }
      }
    }

    fetchBrands()
  }, [page, requestPage])

  const setPage = useCallback((nextPage: number) => {
    const normalizedPage = Number.isFinite(nextPage)
      ? Math.max(1, Math.floor(nextPage))
      : 1
    setPageState(normalizedPage)
  }, [])

  const hasNext = page * perPage < total
  const hasPrev = page > 1

  const nextPage = useCallback(() => {
    setPageState((currentPage) =>
      currentPage * perPage < total ? currentPage + 1 : currentPage,
    )
  }, [perPage, total])

  const prevPage = useCallback(() => {
    setPageState((currentPage) => Math.max(1, currentPage - 1))
  }, [])

  return {
    items,
    page,
    perPage,
    total,
    loading,
    error,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    setPage,
  }
}

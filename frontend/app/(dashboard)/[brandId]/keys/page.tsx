'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useKeys } from '@/hooks/use-keys'
import { ProviderTabs } from '@/components/keys/provider-tabs'
import { KeyCard } from '@/components/keys/key-card'
import { AddKeyModal } from '@/components/keys/add-key-modal'
import { Button } from '@/components/ui/button'
import { Notice } from '@/components/ui/notice'
import { apiRequest } from '@/lib/api'
import { ProviderKey, ValidateKeyResponse } from '@/types'

export default function KeysPage() {
  const params = useParams()
  const brandId = Array.isArray(params.brandId) ? params.brandId[0] : params.brandId ?? ''
  const { keys, loading, error, refetch } = useKeys(brandId)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalProvider, setAddModalProvider] = useState<'openai' | 'gemini'>('openai')
  const [validatingKeyId, setValidatingKeyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleValidate = async (keyId: string) => {
    setValidatingKeyId(keyId)
    setActionError(null)
    try {
      await apiRequest<ValidateKeyResponse>(`/brands/${brandId}/keys/${keyId}/validate`, {
        method: 'POST',
      })
      refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setValidatingKeyId(null)
    }
  }

  const handleActivate = async (keyId: string) => {
    setActionError(null)
    try {
      await apiRequest<ProviderKey>(`/brands/${brandId}/keys/${keyId}/activate`, {
        method: 'PATCH',
      })
      refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Activation failed')
    }
  }

  const handleDelete = async (keyId: string) => {
    setActionError(null)
    try {
      await apiRequest(`/brands/${brandId}/keys/${keyId}`, { method: 'DELETE' })
      refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Deletion failed')
    }
  }

  const handleAddClick = (provider: 'openai' | 'gemini') => {
    setAddModalProvider(provider)
    setShowAddModal(true)
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  if (error) {
    return <p className="text-destructive">Failed to load keys.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[30px] font-semibold leading-[1.16] tracking-tight">Keys</h1>
        <Button type="button" onClick={() => handleAddClick('openai')}>
          <Plus className="h-4 w-4" />
          Add key
        </Button>
      </div>

      {actionError && <Notice variant="danger">{actionError}</Notice>}

      <ProviderTabs keys={keys}>
        {(filteredKeys, activeProvider) => (
          <div className="space-y-2.5">
            {filteredKeys.length === 0 ? (
              <Notice variant="warning">
                No {activeProvider === 'openai' ? 'OpenAI' : 'Gemini'} key yet —{' '}
                <button
                  type="button"
                  onClick={() => handleAddClick(activeProvider)}
                  className="font-medium underline underline-offset-2"
                >
                  Add one
                </button>{' '}
                to generate with this provider.
              </Notice>
            ) : (
              filteredKeys.map((k) => (
                <KeyCard
                  key={k.id}
                  keyData={k}
                  onValidate={handleValidate}
                  onActivate={handleActivate}
                  onDelete={handleDelete}
                  isValidating={validatingKeyId === k.id}
                />
              ))
            )}
          </div>
        )}
      </ProviderTabs>

      <AddKeyModal
        brandId={brandId}
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onKeyAdded={refetch}
        defaultProvider={addModalProvider}
      />
    </div>
  )
}

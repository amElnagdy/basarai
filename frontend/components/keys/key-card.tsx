'use client'

import { ProviderKey } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface KeyCardProps {
  keyData: ProviderKey
  onValidate?: (keyId: string) => void
  onActivate?: (keyId: string) => void
  onDelete?: (keyId: string) => void
  isValidating?: boolean
}

export function KeyCard({ keyData, onValidate, onActivate, onDelete, isValidating }: KeyCardProps) {
  return (
    <div className="space-y-2.5 rounded-lg border border-border px-4 py-[15px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[13px] text-foreground">
            ••••{keyData.key_hint || '????'}
          </span>
          {keyData.label && (
            <span className="truncate text-[12px] text-muted-foreground">
              — {keyData.label}
            </span>
          )}
        </div>
        {keyData.is_active && (
          <Badge variant="success" className="gap-1 normal-case tracking-normal">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Active
          </Badge>
        )}
      </div>

      {keyData.is_valid !== null && (
        <div className="text-[12px]">
          {keyData.is_valid ? (
            <span className="text-success">✓ Valid</span>
          ) : (
            <span className="text-destructive">
              Invalid{keyData.last_validation_error ? `: ${keyData.last_validation_error}` : ''}
            </span>
          )}
          {keyData.last_validated_at && (
            <span className="ml-2 text-muted-foreground">
              checked {new Date(keyData.last_validated_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {onValidate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onValidate(keyData.id)}
            disabled={isValidating}
          >
            {isValidating ? 'Validating…' : 'Validate'}
          </Button>
        )}
        {onActivate && !keyData.is_active && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onActivate(keyData.id)}
          >
            Activate
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(keyData.id)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}

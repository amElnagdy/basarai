'use client'

import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
  title?: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  disabled,
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-wrap items-center gap-0.5 rounded-md border border-border bg-secondary p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        const isDisabled = disabled || option.disabled
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={isDisabled}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-[33px] rounded-[8px] px-3 text-[13px] font-medium transition-[color,background-color,box-shadow] duration-fast ease-out',
              selected
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
              isDisabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

'use client'

import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, id, className = '', error, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em]"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={[
          'bg-bg-elevated border rounded-lg w-full',
          'px-3.5 py-2.5 font-space-grotesk text-sm text-text-primary',
          'outline-none placeholder:text-text-muted',
          'transition-[border-color] duration-150',
          error
            ? 'border-accent-reco/60 focus-ring-error'
            : 'border-border-subtle focus-ring',
          className,
        ].join(' ')}
        {...props}
      />

      {error && (
        <p
          id={errorId}
          role="alert"
          className="font-space-grotesk text-[12px] text-accent-reco"
        >
          {error}
        </p>
      )}
    </div>
  )
}

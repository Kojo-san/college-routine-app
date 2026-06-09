import type { TextareaHTMLAttributes } from 'react'

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[
        'flex min-h-[80px] w-full rounded-lg border border-border-subtle bg-bg-elevated',
        'px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none',
        'focus:outline-none focus:ring-1 focus:ring-accent-study focus:border-accent-study',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
      {...props}
    />
  )
}

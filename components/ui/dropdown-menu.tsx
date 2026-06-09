'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  cloneElement,
  isValidElement,
  type ReactNode,
} from 'react'
import { Check } from 'lucide-react'

interface DropdownCtxType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const DropdownCtx = createContext<DropdownCtxType>({ isOpen: false, setIsOpen: () => {} })

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <DropdownCtx.Provider value={{ isOpen, setIsOpen }}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </DropdownCtx.Provider>
  )
}

export function DropdownMenuTrigger({
  asChild,
  children,
  className = '',
}: {
  asChild?: boolean
  children: ReactNode
  className?: string
}) {
  const { isOpen, setIsOpen } = useContext(DropdownCtx)

  if (asChild && isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsOpen(!isOpen)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(children as React.ReactElement<any>).props.onClick?.(e)
      },
    })
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={`inline-flex items-center gap-2 cursor-pointer ${className}`}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  align = 'end',
  className = '',
  children,
}: {
  align?: 'start' | 'end' | 'center'
  className?: string
  children: ReactNode
}) {
  const { isOpen } = useContext(DropdownCtx)
  if (!isOpen) return null

  const alignClass =
    align === 'start' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0'

  return (
    <div
      className={[
        'absolute z-50 top-full mt-1 min-w-[12rem] rounded-lg',
        'border border-border-subtle bg-bg-elevated shadow-xl',
        alignClass,
        className,
      ].join(' ')}
    >
      <div className="py-1">{children}</div>
    </div>
  )
}

export function DropdownMenuLabel({
  className = '',
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={`px-3 py-1.5 text-xs font-semibold text-text-muted ${className}`}>{children}</div>
  )
}

export function DropdownMenuSeparator({ className = '' }: { className?: string }) {
  return <div className={`my-1 border-t border-border-subtle ${className}`} />
}

export function DropdownMenuCheckboxItem({
  checked,
  onCheckedChange,
  className = '',
  children,
}: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={[
        'flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary',
        'hover:bg-bg-surface transition-colors cursor-pointer',
        className,
      ].join(' ')}
    >
      <div
        className={[
          'h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center',
          checked ? 'bg-accent-study border-accent-study' : 'border-border-subtle',
        ].join(' ')}
      >
        {checked && <Check className="h-3 w-3 text-bg-base" />}
      </div>
      {children}
    </button>
  )
}

export function DropdownMenuItem({
  className = '',
  children,
  onClick,
}: {
  className?: string
  children?: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary',
        'hover:bg-bg-surface transition-colors cursor-pointer',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}

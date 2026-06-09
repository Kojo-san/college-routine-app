'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectCtxType {
  value?: string
  onSelect: (v: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  labelsRef: React.MutableRefObject<Record<string, string>>
}

const SelectCtx = createContext<SelectCtxType>({
  onSelect: () => {},
  isOpen: false,
  setIsOpen: () => {},
  labelsRef: { current: {} },
})

export function Select({
  value,
  defaultValue,
  onValueChange,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const labelsRef = useRef<Record<string, string>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const onSelect = useCallback(
    (v: string) => {
      onValueChange?.(v)
      setIsOpen(false)
    },
    [onValueChange],
  )

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
    <SelectCtx.Provider
      value={{ value: value ?? defaultValue, onSelect, isOpen, setIsOpen, labelsRef }}
    >
      <div ref={containerRef} className="relative">
        {children}
      </div>
    </SelectCtx.Provider>
  )
}

export function SelectTrigger({
  className = '',
  children,
  id,
}: {
  className?: string
  children?: ReactNode
  id?: string
}) {
  const { isOpen, setIsOpen } = useContext(SelectCtx)
  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      id={id}
      className={[
        'flex h-10 w-full items-center justify-between rounded-lg',
        'border border-border-subtle bg-bg-elevated px-3 py-2',
        'text-sm text-text-primary cursor-pointer',
        'focus:outline-none focus:ring-1 focus:ring-accent-study',
        className,
      ].join(' ')}
    >
      <span className="flex-1 text-left">{children}</span>
      <ChevronDown
        className={`h-4 w-4 text-text-muted ml-2 flex-shrink-0 transition-transform duration-150 ${
          isOpen ? 'rotate-180' : ''
        }`}
      />
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, labelsRef } = useContext(SelectCtx)
  if (!value) return <span className="text-text-muted">{placeholder ?? 'Sélectionner...'}</span>
  return <span className="truncate">{labelsRef.current[value] || value}</span>
}

export function SelectContent({
  className = '',
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  const { isOpen } = useContext(SelectCtx)
  if (!isOpen) return null
  return (
    <div
      className={[
        'absolute z-50 top-full left-0 mt-1 w-full rounded-lg',
        'border border-border-subtle bg-bg-elevated shadow-xl overflow-hidden',
        className,
      ].join(' ')}
    >
      <div className="py-1">{children}</div>
    </div>
  )
}

export function SelectItem({
  value,
  className = '',
  children,
}: {
  value: string
  className?: string
  children?: ReactNode
}) {
  const { value: selectedValue, onSelect, labelsRef } = useContext(SelectCtx)

  useLayoutEffect(() => {
    if (typeof children === 'string') {
      labelsRef.current[value] = children
    }
  }, [value, children, labelsRef])

  const isSelected = selectedValue === value

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={[
        'flex w-full items-center gap-2 px-3 py-2 text-sm text-left cursor-pointer',
        'transition-colors hover:bg-bg-surface',
        isSelected ? 'text-accent-study font-medium' : 'text-text-primary',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function SelectLabel({ className = '', children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={`px-3 py-1 text-xs font-semibold text-text-muted ${className}`}>{children}</div>
  )
}

export function SelectSeparator({ className = '' }: { className?: string }) {
  return <div className={`my-1 border-t border-border-subtle ${className}`} />
}

import { useEffect, useRef, useState } from 'react'
import { Button } from './button'
import { Input } from './input'
// Собственный поповер без Radix

export interface AutocompleteProps extends React.ComponentProps<'input'> {
  suggestions?: string[]
  onValueChange?: (next: string) => void
}

export function Autocomplete({
  suggestions = [],
  value,
  onValueChange,
  ...props
}: AutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom')
  const [maxHeightPx, setMaxHeightPx] = useState<number>(288)

  const filteredValueSuggestions = suggestions.filter((opt) =>
    opt.toLowerCase().includes(String(value).toLowerCase())
  )

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const next = ev.target.value
    props.onChange?.(ev)
    onValueChange?.(next)
    if (suggestions.some((opt) => opt.toLowerCase().includes(String(next).toLowerCase()))) {
      setOpen(true)
      setActiveIndex(0)
    } else {
      setOpen(false)
    }
  }

  const scrollActiveIntoView = (idx: number) => {
    const el = itemRefs.current[idx]
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }

  const updatePlacement = () => {
    const margin = 8
    const desiredMax = 288
    const minHeight = 120
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const viewportH = window.innerHeight
    const spaceBelow = viewportH - rect.bottom - margin
    const spaceAbove = rect.top - margin
    const placeBottom = spaceBelow >= spaceAbove
    setPlacement(placeBottom ? 'bottom' : 'top')
    const available = placeBottom ? spaceBelow : spaceAbove
    const nextMax = Math.max(minHeight, Math.min(desiredMax, Math.floor(available)))
    setMaxHeightPx(nextMax)
  }

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onDocKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (filteredValueSuggestions.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => {
          const next = Math.min(i + 1, filteredValueSuggestions.length - 1)
          scrollActiveIntoView(next)
          return next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => {
          const next = Math.max(i - 1, 0)
          scrollActiveIntoView(next)
          return next
        })
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const idx = activeIndexRef.current
        const choice = filteredValueSuggestions[idx]
        if (choice) {
          onValueChange?.(choice)
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onDocKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onDocKeyDown)
    }
  }, [open, filteredValueSuggestions])

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    if (!open) return
    updatePlacement()
    const onWindowChange = () => updatePlacement()
    window.addEventListener('resize', onWindowChange)
    window.addEventListener('scroll', onWindowChange, true)
    return () => {
      window.removeEventListener('resize', onWindowChange)
      window.removeEventListener('scroll', onWindowChange, true)
    }
  }, [open, filteredValueSuggestions.length])

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || filteredValueSuggestions.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex((i) => {
              const next = Math.min(i + 1, filteredValueSuggestions.length - 1)
              scrollActiveIntoView(next)
              return next
            })
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex((i) => {
              const next = Math.max(i - 1, 0)
              scrollActiveIntoView(next)
              return next
            })
          } else if (e.key === 'Enter') {
            e.preventDefault()
            const choice = filteredValueSuggestions[activeIndex]
            if (choice) {
              onValueChange?.(choice)
              setOpen(false)
            }
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
      />

      {open && filteredValueSuggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 z-50 inline-block border rounded-md bg-popover text-popover-foreground shadow-md"
          style={
            placement === 'bottom'
              ? { top: 'calc(100% + 8px)' }
              : { bottom: 'calc(100% + 8px)' }
          }
        >
          <div
            className="overflow-auto p-2 overscroll-contain pointer-events-auto"
            style={{ maxHeight: maxHeightPx, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            onWheelCapture={(e) => {
              // Не даём событию прокрутки пройти к родителю страницы
              e.stopPropagation()
            }}
          >
            <div className="flex flex-col gap-2">
              {filteredValueSuggestions.map((s, i) => (
                <Button
                  key={s}
                  ref={(el) => {
                    itemRefs.current[i] = el
                  }}
                  data-active={i === activeIndex || undefined}
                  className={(i === activeIndex ? 'bg-accent ' : '') + 'justify-start px-3 py-2'}
                  variant="ghost"
                  size="sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onValueChange && onValueChange(s)
                    setOpen(false)
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

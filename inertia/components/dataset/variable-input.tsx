import { Input } from '../ui/input'
import { useRef, useState } from 'react'
import * as _ from 'lodash'
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover'

export type VariableInputProps = React.ComponentProps<'input'> & {
  params?: string[]
  openDelimiter?: string
  closeDelimiter?: string
}

export function VariableInput({
  params,
  openDelimiter = '{{',
  closeDelimiter = '}}',
  ...props
}: VariableInputProps) {
  // ... existing code ...
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const emitChange = (next: string) => {
    props.onChange?.({ target: { value: next } } as any)
  }

  const insertParam = (p: string) => {
    const el = inputRef.current
    const value = el?.value ?? String(props.value ?? '')
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? start
    const before = value.slice(0, start)
    const after = value.slice(end)
    const hasOpen = before.endsWith(openDelimiter)
    const needsClosing = !after.startsWith(closeDelimiter)
    const inserted = `${hasOpen ? '' : openDelimiter}${p}${needsClosing ? closeDelimiter : ''}`
    const next = `${before}${inserted}${after}`
    emitChange(next)
    setOpen(false)
    requestAnimationFrame(() => {
      const pos = before.length + inserted.length
      el?.setSelectionRange(pos, pos)
      el?.focus()
    })
  }

  const handleBeforeInput: React.FormEventHandler<HTMLInputElement> = (ev) => {
    requestAnimationFrame(() => {
      const el = inputRef.current
      const val = el?.value ?? String(props.value ?? '')
      const caret = el?.selectionStart ?? val.length
      const before = val.slice(0, caret)
      if (before.endsWith(openDelimiter)) {
        setOpen(true)
        setFilter('')
      }
    })
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    props.onChange?.(ev)
    const val = ev.target.value
    const caret = ev.target.selectionStart ?? val.length
    const before = val.slice(0, caret)

    if (open) {
      const lastIdx = before.lastIndexOf(openDelimiter)
      const q = lastIdx >= 0 ? before.slice(lastIdx + openDelimiter.length) : ''
      setFilter(q)
    } else {
      if (before.endsWith(openDelimiter)) {
        setOpen(true)
        setFilter('')
      }
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (ev) => {
    props.onKeyDown?.(ev)
    if (ev.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (ev) => {
    props.onBlur?.(ev)
    setOpen(false)
  }

  const list = (params || []).filter((p) => p.toLowerCase().includes(filter.toLowerCase()))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          {...props}
          ref={inputRef}
          onBeforeInput={handleBeforeInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[var(--radix-popover-trigger-width)] p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {list.map((p) => (
          <button
            key={p}
            type="button"
            className="w-full rounded-sm px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
            onMouseDown={(e) => {
              e.preventDefault()
              insertParam(p)
            }}
          >
            {p}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
  // ... existing code ...
}

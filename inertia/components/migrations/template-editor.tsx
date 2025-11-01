import { useEffect, useRef, useState } from 'react'
import { Textarea } from '~/components/ui/textarea'
import { Popover, PopoverAnchor, PopoverContent } from '~/components/ui/popover'
import { Button } from '~/components/ui/button'

export type TemplateEditorProps = {
  value: string
  columns?: string[]
  onChange: (val: string) => void
}

export function TemplateEditor({ value, columns = [], onChange }: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const anchorRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = (columns || [])
    .filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8)

  const updateQueryFromCaret = () => {
    const ta = textareaRef.current
    if (!ta) return
    const caret = ta.selectionStart ?? value.length
    const before = value.slice(0, caret)
    const lastOpen = before.lastIndexOf('{')
    const lastClose = before.lastIndexOf('}')
    const insideBraces = lastOpen > lastClose
    if (insideBraces) {
      const current = before.slice(lastOpen + 1)
      setQuery(current)
      setOpen(true)
    } else {
      setOpen(false)
      setQuery('')
    }
  }

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (ev) => {
    const next = ev.target.value
    onChange(next)
    // After value update, recalc query position.
    setTimeout(updateQueryFromCaret, 0)
  }

  const insertColumn = (col: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const caret = ta.selectionStart ?? value.length
    const before = value.slice(0, caret)
    const lastOpen = before.lastIndexOf('{')
    const lastClose = before.lastIndexOf('}')
    const insideBraces = lastOpen > lastClose

    const start = insideBraces ? lastOpen : caret
    const end = caret
    const inserted = `{${col}}`
    const next = value.slice(0, start) + inserted + value.slice(end)
    onChange(next)
    setOpen(false)
    setQuery('')

    // Place caret after inserted token.
    requestAnimationFrame(() => {
      const pos = start + inserted.length
      ta.focus()
      try {
        ta.setSelectionRange(pos, pos)
      } catch {
        // noop
      }
    })
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (ev) => {
    if (ev.key === 'Escape' && open) {
      setOpen(false)
      setQuery('')
      return
    }
    if (ev.key === 'Enter' && open) {
      if (filtered.length > 0) {
        ev.preventDefault()
        insertColumn(filtered[0])
      }
      return
    }
    // Let key event happen, then recompute position & query
    setTimeout(updateQueryFromCaret, 0)
  }

  useEffect(() => {
    // Initial compute on mount
    updateQueryFromCaret()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={anchorRef}>
          <Textarea
            ref={textareaRef}
            className="min-h-24 w-full"
            placeholder="Например: {price} * 1.2"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={() => setTimeout(updateQueryFromCaret, 0)}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[var(--radix-popover-trigger-width)] p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {filtered.map((c) => (
          <Button
            key={c}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertColumn(c)}
            title={`Вставить {${c}}`}
          >
            {'{'}
            {c}
            {'}'}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

import { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Popover, PopoverContent, PopoverAnchor } from './popover'

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
  const filteredValueSuggestions = suggestions
    .filter((opt) => opt.toLowerCase().includes(String(value).toLowerCase()))
    .slice(0, 8)

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const next = ev.target.value
    props.onChange?.(ev)
    onValueChange?.(next)
    if (suggestions.some((opt) => opt.toLowerCase().includes(String(next).toLowerCase()))) {
      setOpen(true)
    }
  }

  return (
    <Popover open={open && filteredValueSuggestions.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input {...props} value={value} onChange={handleChange} onClick={() => setOpen(true)} />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[var(--radix-popover-trigger-width)] p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {filteredValueSuggestions.map((s) => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onValueChange && onValueChange(s)
              setOpen(false)
            }}
          >
            {s}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

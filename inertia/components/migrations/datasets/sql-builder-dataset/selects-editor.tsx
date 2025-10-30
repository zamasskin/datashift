import { Trash } from 'lucide-react'
import { Autocomplete } from '~/components/ui/autocomplete'
import { Button } from '~/components/ui/button'
import { Item, ItemContent } from '~/components/ui/item'
import { ScrollArea } from '~/components/ui/scroll-area'

export type SelectsEditorProps = {
  suggestions?: string[]
  value?: string[]
  onChange?: (value: string[]) => void
}

export function SelectsEditor({ suggestions, value, onChange }: SelectsEditorProps) {
  const selects = Array.isArray(value) ? value : []

  return (
    <div className="space-y-2">
      <ScrollArea className="max-h-72 max-w-full overflow-scroll">
        {selects.map((sel, idx) => (
          <Item key={idx} variant="outline">
            <ItemContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-[240px]">
                  <Autocomplete
                    suggestions={suggestions}
                    value={sel}
                    onValueChange={(v) => {
                      if (onChange) {
                        const next = [...selects]
                        next[idx] = v
                        onChange(next)
                      }
                    }}
                    placeholder="таблица.колонка"
                  />
                </div>
                <Button
                  variant="secondary"
                  className="h-8"
                  onClick={() => {
                    if (onChange) {
                      const next = selects.filter((_, i) => i !== idx)
                      onChange(next)
                    }
                  }}
                >
                  <Trash className="size-4" /> Удалить
                </Button>
              </div>
            </ItemContent>
          </Item>
        ))}
      </ScrollArea>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (onChange) {
              onChange([...selects, ''])
            }
          }}
        >
          Добавить поле
        </Button>
      </div>
    </div>
  )
}

export default SelectsEditor

import { Trash } from 'lucide-react'
import { Autocomplete } from '~/components/ui/autocomplete'
import { Button } from '~/components/ui/button'
import { Item, ItemContent } from '~/components/ui/item'

export type GroupEditorProps = {
  suggestions?: string[]
  value?: string[]
  onChange?: (value: string[]) => void
}

export function GroupEditor({ suggestions, value, onChange }: GroupEditorProps) {
  const groups = Array.isArray(value) ? value : []

  return (
    <div className="space-y-2">
      {groups.map((sel, idx) => (
        <Item key={idx} variant="outline">
          <ItemContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-[240px]">
                <Autocomplete
                  suggestions={suggestions}
                  value={sel}
                  onValueChange={(v) => {
                    if (onChange) {
                      const next = [...groups]
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
                    const next = groups.filter((_, i) => i !== idx)
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

      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (onChange) {
              onChange([...groups, ''])
            }
          }}
        >
          Добавить поле группировки
        </Button>
      </div>
    </div>
  )
}

export default GroupEditor
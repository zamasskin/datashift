import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel, FieldGroup } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

export type ParamType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'json'
export type ParamItem = { key: string; type: ParamType; value: string }

export function ParamsEditor({
  label = 'Параметры',
  value = [],
  onChange,
}: {
  label?: string
  value?: ParamItem[]
  onChange?: (items: ParamItem[]) => void
}) {
  const [items, setItems] = useState<ParamItem[]>(value)

  const update = (next: ParamItem[]) => {
    setItems(next)
    onChange?.(next)
  }

  const addItem = () => update([...items, { key: '', type: 'string', value: '' }])
  const removeItem = (idx: number) => update(items.filter((_, i) => i !== idx))

  const setItem = (idx: number, patch: Partial<ParamItem>) => {
    const next = items.slice()
    next[idx] = { ...next[idx], ...patch }
    update(next)
  }

  const typeOptions: { value: ParamType; label: string }[] = [
    { value: 'string', label: 'Строка' },
    { value: 'number', label: 'Число' },
    { value: 'boolean', label: 'Булево' },
    { value: 'date', label: 'Дата' },
    { value: 'datetime', label: 'Дата‑время' },
    { value: 'json', label: 'JSON' },
  ]

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <FieldGroup>
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-wrap gap-2">
            <Input
              placeholder="ключ"
              value={item.key}
              onChange={(e) => setItem(idx, { key: e.target.value })}
            />
            <Select value={item.type} onValueChange={(v) => setItem(idx, { type: v as ParamType })}>
              <SelectTrigger className="min-w-40">
                <SelectValue placeholder="тип" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="значение"
              value={item.value}
              onChange={(e) => setItem(idx, { value: e.target.value })}
            />
            <Button variant="secondary" type="button" onClick={() => removeItem(idx)}>
              Удалить
            </Button>
          </div>
        ))}
        <div>
          <Button variant="outline" type="button" onClick={addItem}>
            Добавить параметр
          </Button>
        </div>
      </FieldGroup>
    </Field>
  )
}
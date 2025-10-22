import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel, FieldGroup } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { PlusIcon, Trash2Icon } from 'lucide-react'

export type DatasetParamType = 'string' | 'number' | 'date' | 'date_range'
export type DatasetParamItem = {
  key: string
  title?: string
  type: DatasetParamType
  value?: string
  valueFrom?: string
  valueTo?: string
}

export function ParamsEditor({
  label = 'Параметры',
  value = [],
  onChange,
  className,
}: {
  label?: string
  value?: DatasetParamItem[]
  onChange?: (items: DatasetParamItem[]) => void
  className?: string
}) {
  const [items, setItems] = useState<DatasetParamItem[]>(value)

  const update = (next: DatasetParamItem[]) => {
    setItems(next)
    onChange?.(next)
  }

  const addItem = () => update([...items, { key: '', title: '', type: 'string' }])
  const removeItem = (idx: number) => update(items.filter((_, i) => i !== idx))

  const setItem = (idx: number, patch: Partial<DatasetParamItem>) => {
    const next = items.slice()
    next[idx] = { ...next[idx], ...patch }
    update(next)
  }

  const typeOptions: { value: DatasetParamType; label: string }[] = [
    { value: 'string', label: 'Строка' },
    { value: 'number', label: 'Число' },
    { value: 'date', label: 'Дата' },
    { value: 'date_range', label: 'Диапазон дат' },
  ]

  return (
    <Field className={className}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Button variant="secondary" size="sm" type="button" onClick={addItem} className="h-8 gap-1" title="Добавить параметр">
          <PlusIcon className="h-3.5 w-3.5" />
          Добавить параметр
        </Button>
      </div>
      <FieldGroup>
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-wrap gap-1.5 items-center">
            <Input
              className="h-8"
              placeholder="ключ (латиница)"
              title="Ключ параметра: только латиница, лишние символы удаляются"
              value={item.key}
              onChange={(e) => {
                const raw = e.target.value
                const cleaned = raw.replace(/[^A-Za-z]/g, '')
                setItem(idx, { key: cleaned })
              }}
            />
            <Input
              className="h-8"
              placeholder="название (подпись)"
              title="Подпись параметра (отображается над значением)"
              value={item.title || ''}
              onChange={(e) => setItem(idx, { title: e.target.value })}
            />
            <Select value={item.type} onValueChange={(v) => setItem(idx, { type: v as DatasetParamType })}>
              <SelectTrigger className="min-w-40 h-8" title="Тип параметра">
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
            <Button
              className="ml-auto h-8 p-2"
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => removeItem(idx)}
              aria-label="Удалить"
              title="Удалить параметр"
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </FieldGroup>
    </Field>
  )
}
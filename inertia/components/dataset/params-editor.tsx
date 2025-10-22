import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Field, FieldGroup, FieldError } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
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

  const keyCounts = items.reduce(
    (acc, i) => {
      const k = (i.key || '').trim().toLowerCase()
      if (!k) return acc
      acc[k] = (acc[k] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const hasEmptyKeys = items.some((i) => !(i.key || '').trim())
  const duplicateKeys = Object.entries(keyCounts)
    .filter(([_, count]) => count > 1)
    .map(([key]) => key)
  const hasDuplicates = duplicateKeys.length > 0
  const hasErrors = hasEmptyKeys || hasDuplicates

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
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={addItem}
          className="h-8 gap-1"
          title="Добавить параметр"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Добавить параметр
        </Button>
      </div>
      <FieldGroup>
        {items.map((item, idx) => {
          const keyTrim = (item.key || '').trim()
          const keyLower = keyTrim.toLowerCase()
          const isEmpty = keyTrim.length === 0
          const isDuplicate = !isEmpty && (keyCounts[keyLower] || 0) > 1
          const keyErrorMsg = isEmpty
            ? 'Заполните ключ'
            : isDuplicate
              ? 'Ключ должен быть уникальным'
              : ''

          return (
            <div key={idx} className="flex flex-wrap gap-1.5 items-start">
              <div className="flex flex-col min-w-40">
                <Input
                  className={`h-8 ${isEmpty || isDuplicate ? 'border-red-500' : ''}`}
                  placeholder="ключ (латиница)"
                  aria-invalid={isEmpty || isDuplicate}
                  title={
                    isEmpty
                      ? 'Заполните ключ'
                      : isDuplicate
                        ? 'Ключ должен быть уникальным'
                        : 'Ключ параметра: только латиница, лишние символы удаляются'
                  }
                  value={item.key}
                  onChange={(e) => {
                    const raw = e.target.value
                    const cleaned = raw.replace(/[^A-Za-z]/g, '')
                    setItem(idx, { key: cleaned })
                  }}
                />
                {(isEmpty || isDuplicate) && <FieldError errors={[{ message: keyErrorMsg }]} />}
              </div>
              <Input
                className="h-8"
                placeholder="название (подпись)"
                title="Подпись параметра (отображается над значением)"
                value={item.title || ''}
                onChange={(e) => setItem(idx, { title: e.target.value })}
              />
              <Select
                value={item.type}
                onValueChange={(v) => setItem(idx, { type: v as DatasetParamType })}
              >
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
          )
        })}
      </FieldGroup>
    </Field>
  )
}

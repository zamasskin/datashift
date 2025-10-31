import { useEffect, useMemo, useState } from 'react'
import { DurationInputArg1, DurationInputArg2 } from 'moment'
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

export type ParamsEditorProps = {
  params?: Param[]
  onChange?: (params: Param[]) => void
  className?: string
  label?: string
}

export function ParamsEditor({
  params = [],
  onChange,
  className,
  label = 'Параметры',
}: ParamsEditorProps) {
  const [items, setItems] = useState<ParamItem[]>(() => toItems(params))

  useEffect(() => {
    setItems(toItems(params))
  }, [params])

  const update = (next: ParamItem[]) => {
    setItems(next)
    onChange?.(toParams(next))
  }

  const keyCounts = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        const k = (i.key || '').trim().toLowerCase()
        if (!k) return acc
        acc[k] = (acc[k] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }, [items])

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
    { value: 'date', label: 'Дата (операция)' },
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
              <Select
                value={item.type}
                onValueChange={(v) => setItem(idx, { type: v as ParamType })}
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

              {/* Value editor */}
              {item.type === 'string' && (
                <Input
                  className="h-8"
                  placeholder="значение"
                  title="Строковое значение"
                  value={String(item.value ?? '')}
                  onChange={(e) => setItem(idx, { value: e.target.value })}
                />
              )}

              {item.type === 'number' && (
                <NumberValueEditor
                  value={typeof item.value === 'number' ? item.value : undefined}
                  onChange={(num) => setItem(idx, { value: num })}
                />
              )}

              {item.type === 'boolean' && (
                <Select
                  value={String(Boolean(item.value))}
                  onValueChange={(v) => setItem(idx, { value: v === 'true' })}
                >
                  <SelectTrigger className="min-w-32 h-8" title="Булево значение">
                    <SelectValue placeholder="значение" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {item.type === 'date' && (
                <DateValueEditor
                  value={isDateValue(item.value) ? (item.value as DateParamValue) : undefined}
                  onChange={(val) => setItem(idx, { value: val })}
                />
              )}

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

export type DateParamValue =
  | { type: 'add'; amount: DurationInputArg1; unit?: DurationInputArg2 }
  | { type: 'subtract'; amount: DurationInputArg1; unit?: DurationInputArg2 }
  | { type: 'startOf'; unit: 'day' | 'week' | 'month' | 'quarter' | 'year' }
  | { type: 'endOf'; unit: 'day' | 'week' | 'month' | 'quarter' | 'year' }
  | { type: 'format'; format: string }

export type ParamType = 'string' | 'number' | 'boolean' | 'date'

export type ParamItem = {
  key: string
  type: ParamType
  value?: string | number | boolean | DateParamValue
}

type BooleanParam = {
  key: string
  type: 'boolean'
  value: boolean
}

type DateParam = {
  key: string
  type: 'date'
  value: DateParamValue
}

type StringParam = {
  key: string
  type: 'string'
  value: string
}

type NumberParam = {
  key: string
  type: 'number'
  value: number
}

type Param = StringParam | NumberParam | DateParam | BooleanParam

function toItems(params: Param[]): ParamItem[] {
  return (params || []).map((p) => ({
    key: (p as any).key || '',
    type: p.type as ParamType,
    value: (p as any).value,
  }))
}

function toParams(items: ParamItem[]): Param[] {
  return (items || []).map((i) => ({ key: i.key, type: i.type, value: i.value }) as Param)
}

function isDateValue(v: any): v is DateParamValue {
  if (!v || typeof v !== 'object') return false
  return 'type' in v && ['add', 'subtract', 'startOf', 'endOf', 'format'].includes((v as any).type)
}

function NumberValueEditor({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const [text, setText] = useState<string>(() => (typeof value === 'number' ? String(value) : ''))

  useEffect(() => {
    setText(typeof value === 'number' ? String(value) : '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setText(raw)
    const n = parseInt(raw, 10)
    if (!Number.isNaN(n) && n > 0) {
      onChange(n)
    }
  }

  const handleBlur = () => {
    const n = parseInt(text, 10)
    if (!Number.isNaN(n) && n > 0) {
      setText(String(n))
      onChange(n)
    } else {
      setText('1')
      onChange(1)
    }
  }

  return (
    <Input
      className="h-8"
      inputMode="numeric"
      type="number"
      min={1}
      step={1}
      placeholder="число"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

function DateValueEditor({
  value,
  onChange,
}: {
  value?: DateParamValue
  onChange: (v: DateParamValue) => void
}) {
  const [kind, setKind] = useState<DateParamValue['type']>(value?.type || 'startOf')
  const [amountText, setAmountText] = useState<string>(() => {
    const raw = (value as any)?.amount
    return typeof raw === 'number' ? String(raw) : ''
  })
  const [unitDuration, setUnitDuration] = useState<DurationInputArg2 | undefined>(
    () => (value as any)?.unit
  )
  const [unitBoundary, setUnitBoundary] = useState<
    'day' | 'week' | 'month' | 'quarter' | 'year' | undefined
  >(() => (value as any)?.unit)
  const [format, setFormat] = useState<string>(
    () => ((value as any)?.format as string) || 'YYYY-MM-DD'
  )

  useEffect(() => {
    if (!value) return
    setKind(value.type)
    if (value.type === 'add' || value.type === 'subtract') {
      const raw = (value as any)?.amount
      setAmountText(typeof raw === 'number' ? String(raw) : '')
      setUnitDuration((value as any)?.unit as DurationInputArg2)
      setUnitBoundary(undefined)
    } else if (value.type === 'startOf' || value.type === 'endOf') {
      setUnitBoundary((value as any)?.unit as 'day' | 'week' | 'month' | 'quarter' | 'year')
      setUnitDuration(undefined)
    } else if (value.type === 'format') {
      setFormat((value as any)?.format || 'YYYY-MM-DD')
      setUnitDuration(undefined)
      setUnitBoundary(undefined)
    }
  }, [value])

  useEffect(() => {
    // propagate changes
    if (kind === 'add' || kind === 'subtract') {
      const n = parseInt(amountText, 10)
      const amount: DurationInputArg1 = !Number.isNaN(n) && n > 0 ? n : 1
      const payload: {
        type: 'add' | 'subtract'
        amount: DurationInputArg1
        unit?: DurationInputArg2
      } = {
        type: kind,
        amount,
        unit: unitDuration,
      }
      onChange(payload as DateParamValue)
    } else if (kind === 'startOf' || kind === 'endOf') {
      const payload: {
        type: 'startOf' | 'endOf'
        unit: 'day' | 'week' | 'month' | 'quarter' | 'year'
      } = {
        type: kind,
        unit: unitBoundary ?? 'day',
      }
      onChange(payload)
    } else if (kind === 'format') {
      onChange({ type: 'format', format })
    }
  }, [kind, amountText, unitDuration, unitBoundary, format])

  const dateUnits: { value: DurationInputArg2; label: string }[] = [
    { value: 'second', label: 'Секунды' },
    { value: 'minute', label: 'Минуты' },
    { value: 'hour', label: 'Часы' },
    { value: 'day', label: 'Дни' },
    { value: 'week', label: 'Недели' },
    { value: 'month', label: 'Месяцы' },
    { value: 'quarter', label: 'Кварталы' },
    { value: 'year', label: 'Годы' },
  ]

  const startEndUnits: { value: 'day' | 'week' | 'month' | 'quarter' | 'year'; label: string }[] = [
    { value: 'day', label: 'День' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'quarter', label: 'Квартал' },
    { value: 'year', label: 'Год' },
  ]

  return (
    <div className="flex flex-wrap gap-1.5 items-start">
      <Select value={kind} onValueChange={(v) => setKind(v as DateParamValue['type'])}>
        <SelectTrigger className="min-w-40 h-8" title="Операция даты">
          <SelectValue placeholder="операция" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="add">add</SelectItem>
          <SelectItem value="subtract">subtract</SelectItem>
          <SelectItem value="startOf">startOf</SelectItem>
          <SelectItem value="endOf">endOf</SelectItem>
          <SelectItem value="format">format</SelectItem>
        </SelectContent>
      </Select>

      {(kind === 'add' || kind === 'subtract') && (
        <>
          <Input
            className="h-8"
            inputMode="numeric"
            type="number"
            min={1}
            step={1}
            placeholder="количество"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            onBlur={() => {
              const n = parseInt(amountText, 10)
              if (Number.isNaN(n) || n <= 0) setAmountText('1')
            }}
          />
          <Select
            value={String(unitDuration || '')}
            onValueChange={(v) => setUnitDuration(v as DurationInputArg2)}
          >
            <SelectTrigger className="min-w-40 h-8" title="Единица измерения">
              <SelectValue placeholder="единица" />
            </SelectTrigger>
            <SelectContent>
              {dateUnits.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {(kind === 'startOf' || kind === 'endOf') && (
        <Select
          value={String(unitBoundary || '')}
          onValueChange={(v) => setUnitBoundary(v as 'day' | 'week' | 'month' | 'quarter' | 'year')}
        >
          <SelectTrigger className="min-w-40 h-8" title="Единица (граница)">
            <SelectValue placeholder="единица" />
          </SelectTrigger>
          <SelectContent>
            {startEndUnits.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {kind === 'format' && (
        <Input
          className="h-8"
          placeholder="формат (например, YYYY-MM-DD)"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        />
      )}
    </div>
  )
}

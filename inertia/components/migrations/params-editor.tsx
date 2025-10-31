import { useEffect, useMemo, useState } from 'react'
import { DurationInputArg1, DurationInputArg2 } from 'moment'
import { Button } from '~/components/ui/button'
import { Field, FieldGroup, FieldError } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Calendar } from '~/components/ui/calendar'
import { Item } from '~/components/ui/item'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { PlusIcon, Trash2Icon, Calendar as CalendarIcon } from 'lucide-react'
import { format as formatDate, parse as parseDate } from 'date-fns'

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
            <Item
              key={idx}
              variant="outline"
              size="sm"
              className="w-full items-start gap-1 py-3 px-3"
            >
              <div className="flex flex-wrap gap-1 items-start justify-between w-full">
                <div className="flex gap-2 items-start">
                  <div className="flex flex-col min-w-36">
                    <Input
                      className={`${isEmpty || isDuplicate ? 'border-red-500' : ''}`}
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
                    <SelectTrigger className="min-w-32 h-8" title="Тип параметра">
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
                </div>

                <Button
                  className="h-8 p-2"
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => removeItem(idx)}
                  aria-label="Удалить"
                  title="Удалить параметр"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>

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
              </div>
            </Item>
          )
        })}
      </FieldGroup>
    </Field>
  )
}

export type DateOp = { amount: DurationInputArg1; unit: DurationInputArg2 }
export type DateParamValue =
  | { type: 'add'; ops: DateOp[] }
  | { type: 'subtract'; ops: DateOp[] }
  | {
      type: 'startOf'
      unit: 'day' | 'week' | 'month' | 'quarter' | 'year'
      position: 'current' | 'next' | 'previous'
    }
  | {
      type: 'endOf'
      unit: 'day' | 'week' | 'month' | 'quarter' | 'year'
      position: 'current' | 'next' | 'previous'
    }
  | { type: 'exact'; date: string }

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
  return 'type' in v && ['add', 'subtract', 'startOf', 'endOf', 'exact'].includes((v as any).type)
}

function equalOps(
  a: Array<{ amount: number; unit: DurationInputArg2 }>,
  b: Array<{ amount: number; unit: DurationInputArg2 }>
) {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const ai = a[i]
    const bi = b[i]
    if (!ai || !bi) return false
    if (ai.amount !== bi.amount) return false
    if (ai.unit !== bi.unit) return false
  }
  return true
}

function deepEqualDateParamValue(a?: DateParamValue, b?: DateParamValue) {
  if (!isDateValue(a) || !isDateValue(b)) return false
  if (a.type !== b.type) return false
  if (a.type === 'add' || a.type === 'subtract') {
    const aOps = (a as { ops: DateOp[] }).ops || []
    const bOps = (b as { ops: DateOp[] }).ops || []
    if (aOps.length !== bOps.length) return false
    for (let i = 0; i < aOps.length; i++) {
      const ao = aOps[i]
      const bo = bOps[i]
      if (!ao || !bo) return false
      if (ao.amount !== bo.amount) return false
      if (ao.unit !== bo.unit) return false
    }
    return true
  }
  if (a.type === 'startOf' || a.type === 'endOf') {
    return (a as any).unit === (b as any).unit && (a as any).position === (b as any).position
  }
  if (a.type === 'exact') {
    return (a as any).date === (b as any).date
  }
  return false
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
  const defaultOp: { amount: number; unit: DurationInputArg2 } = {
    amount: 1,
    unit: 'day' as DurationInputArg2,
  }
  const [ops, setOps] = useState<Array<{ amount: number; unit: DurationInputArg2 }>>(() => {
    const v = value as any
    if (v?.type === 'add' || v?.type === 'subtract') {
      const rawOps = Array.isArray(v.ops) ? v.ops : []
      const normalized = rawOps.map((o: any) => ({
        amount: Number(o?.amount) || 1,
        unit: (o?.unit as DurationInputArg2) || ('day' as DurationInputArg2),
      }))
      return normalized.length > 0 ? normalized : [defaultOp]
    }
    return [defaultOp]
  })
  const [unitBoundary, setUnitBoundary] = useState<
    'day' | 'week' | 'month' | 'quarter' | 'year' | undefined
  >(() => (value as any)?.unit)
  const [position, setPosition] = useState<'current' | 'next' | 'previous'>(
    () => ((value as any)?.position as 'current' | 'next' | 'previous') || 'current'
  )
  const [exactDate, setExactDate] = useState<string>(() => {
    const v = value as any
    if (v?.type === 'exact') {
      return typeof v.date === 'string' && v.date ? v.date : formatDate(new Date(), 'yyyy-MM-dd')
    }
    return formatDate(new Date(), 'yyyy-MM-dd')
  })

  useEffect(() => {
    if (!value) return
    setKind((prev) => (prev === value.type ? prev : value.type))
    if (value.type === 'add' || value.type === 'subtract') {
      const rawOps = (value as any)?.ops
      if (Array.isArray(rawOps)) {
        const normalized = rawOps.map((o: any) => ({
          amount: Number(o?.amount) || 1,
          unit: (o?.unit as DurationInputArg2) || ('day' as DurationInputArg2),
        }))
        const nextOps = normalized.length > 0 ? normalized : [defaultOp]
        setOps((prev) => (equalOps(prev, nextOps) ? prev : nextOps))
      } else {
        const fallback = [defaultOp]
        setOps((prev) => (equalOps(prev, fallback) ? prev : fallback))
      }
      setUnitBoundary(undefined)
    } else if (value.type === 'startOf' || value.type === 'endOf') {
      const nextUnit = (value as any)?.unit as 'day' | 'week' | 'month' | 'quarter' | 'year'
      setUnitBoundary((prev) => (prev === nextUnit ? prev : nextUnit))
      const nextPos = ((value as any)?.position as 'current' | 'next' | 'previous') || 'current'
      setPosition((prev) => (prev === nextPos ? prev : nextPos))
    } else if ((value as any)?.type === 'exact') {
      const nextDate = (value as any)?.date || formatDate(new Date(), 'yyyy-MM-dd')
      setExactDate((prev) => (prev === nextDate ? prev : nextDate))
      setUnitBoundary(undefined)
    }
  }, [value])

  useEffect(() => {
    // propagate changes
    let payload: DateParamValue | undefined
    if (kind === 'add' || kind === 'subtract') {
      payload = {
        type: kind,
        ops: ops.map((o) => ({ amount: o.amount as DurationInputArg1, unit: o.unit })),
      }
    } else if (kind === 'startOf' || kind === 'endOf') {
      payload = {
        type: kind,
        unit: unitBoundary ?? 'day',
        position,
      }
    } else if (kind === 'exact') {
      payload = { type: 'exact', date: exactDate }
    }
    if (payload && (!isDateValue(value) || !deepEqualDateParamValue(payload, value))) {
      onChange(payload)
    }
  }, [kind, ops, unitBoundary, position, exactDate])

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
  const positionOptions: { value: 'current' | 'next' | 'previous'; label: string }[] = [
    { value: 'current', label: 'Текущей' },
    { value: 'next', label: 'Следующей' },
    { value: 'previous', label: 'Предыдущей' },
  ]

  return (
    <div className="flex flex-wrap gap-1.5 items-start">
      <Select value={kind} onValueChange={(v) => setKind(v as DateParamValue['type'])}>
        <SelectTrigger className="min-w-40 h-8" title="Операция даты">
          <SelectValue placeholder="операция" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="add">Прибавить</SelectItem>
          <SelectItem value="subtract">Отнять</SelectItem>
          <SelectItem value="startOf">Начало</SelectItem>
          <SelectItem value="endOf">Конец</SelectItem>
          <SelectItem value="exact">Точная дата</SelectItem>
        </SelectContent>
      </Select>

      {(kind === 'add' || kind === 'subtract') && (
        <div className="flex flex-col gap-2">
          {ops.map((op, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <NumberValueEditor
                value={op.amount}
                onChange={(num) => {
                  const next = ops.slice()
                  next[idx] = { ...next[idx], amount: num }
                  setOps(next)
                }}
              />
              <Select
                value={op.unit}
                onValueChange={(v) => {
                  const next = ops.slice()
                  next[idx] = { ...next[idx], unit: v as DurationInputArg2 }
                  setOps(next)
                }}
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
              <Button
                className="ml-auto h-8 p-2"
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  if (ops.length <= 1) return
                  const next = ops.filter((_, i) => i !== idx)
                  setOps(next)
                }}
                aria-label="Удалить шаг"
                title="Удалить шаг"
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className="h-8 gap-1"
              onClick={() => setOps([...ops, { ...defaultOp }])}
              title="Добавить шаг"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Добавить шаг
            </Button>
          </div>
        </div>
      )}

      {(kind === 'startOf' || kind === 'endOf') && (
        <>
          <Select
            value={String(unitBoundary || '')}
            onValueChange={(v) =>
              setUnitBoundary(v as 'day' | 'week' | 'month' | 'quarter' | 'year')
            }
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
          <Select
            value={position}
            onValueChange={(v) => setPosition(v as 'current' | 'next' | 'previous')}
          >
            <SelectTrigger className="min-w-40 h-8" title="Период">
              <SelectValue placeholder="период" />
            </SelectTrigger>
            <SelectContent>
              {positionOptions.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {kind === 'exact' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 min-w-40 justify-start">
              <CalendarIcon className="mr-2" />
              {exactDate || 'Выберите дату'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={(() => {
                try {
                  return parseDate(exactDate, 'yyyy-MM-dd', new Date())
                } catch {
                  return undefined
                }
              })()}
              onSelect={(d) => {
                if (d) setExactDate(formatDate(d, 'yyyy-MM-dd'))
              }}
              showOutsideDays
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { DurationInputArg1, DurationInputArg2 } from 'moment'
import { Button } from '~/components/ui/button'
import { Field, FieldContent, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Calendar } from '~/components/ui/calendar'
import { Item } from '~/components/ui/item'
import { ItemGroup } from '~/components/ui/item'
import { ScrollArea } from '~/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { PlusIcon, Trash2Icon, Calendar as CalendarIcon } from 'lucide-react'
import { format as formatDate, parse as parseDate } from 'date-fns'
import { DateOp, DateParamValue, Param, ParamItem, ParamType } from '#interfaces/params'

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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState<ParamItem>({ key: '', type: 'string', value: '' })

  useEffect(() => {
    setItems(toItems(params))
  }, [params])

  const update = (next: ParamItem[]) => {
    setItems(next)
    onChange?.(toParams(next))
  }

  // Удалены неиспользуемые вычисления дубликатов ключей (compact mode)

  const openAdd = () => {
    setEditingIndex(null)
    setDraft({ key: '', type: 'string', value: '' })
    setIsDialogOpen(true)
  }
  const removeItem = (idx: number) => update(items.filter((_, i) => i !== idx))

  // Удалён неиспользуемый помощник setItem (редактирование переносится в модалку)

  const openEdit = (idx: number) => {
    setEditingIndex(idx)
    setDraft(items[idx])
    setIsDialogOpen(true)
  }

  const saveDraft = () => {
    const keyTrim = (draft.key || '').trim()
    const isInvalidName = !/^[A-Za-z_][A-Za-z0-9_]*$/.test(keyTrim)
    const keyLower = keyTrim.toLowerCase()
    const duplicate = items.some(
      (it, i) => i !== editingIndex && (it.key || '').trim().toLowerCase() === keyLower
    )
    if (!keyTrim || isInvalidName || duplicate) {
      // Простая защита: не сохраняем некорректные данные
      return
    }

    if (editingIndex === null) {
      update([...items, { ...draft, key: keyTrim }])
    } else {
      const next = items.slice()
      next[editingIndex] = { ...draft, key: keyTrim }
      update(next)
    }
    setIsDialogOpen(false)
    setEditingIndex(null)
  }

  const typeOptions: { value: ParamType; label: string }[] = [
    { value: 'string', label: 'Строка' },
    { value: 'number', label: 'Число' },
    { value: 'boolean', label: 'Булево' },
    { value: 'date', label: 'Дата (операция)' },
  ]

  return (
    <Field className={className}>
      <FieldLabel className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={openAdd}
          className="h-8 gap-1"
          title="Добавить параметр"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Добавить параметр
        </Button>
      </FieldLabel>
      <FieldContent>
        <ScrollArea className="w-full h-72 overflow-hidden">
          <ItemGroup className="gap-2">
            {items.map((item, idx) => {
              const keyTrim = (item.key || '').trim()

              return (
                <Item
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="w-full items-start gap-1 py-3 px-3"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">{keyTrim || '(без ключа)'}</div>
                      <div className="text-xs text-muted-foreground">Тип: {item.type}</div>
                      <div className="text-xs text-muted-foreground">
                        Значение: {renderValueSummary(item)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        className="h-8 px-2"
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => openEdit(idx)}
                        title="Редактировать параметр"
                      >
                        Редактировать
                      </Button>
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
                    </div>
                  </div>
                </Item>
              )
            })}
          </ItemGroup>
        </ScrollArea>
        {/* Диалог добавления/редактирования параметра */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingIndex === null ? 'Добавить параметр' : 'Редактировать параметр'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              {(() => {
                const keyId = `param-key`
                const keyTrim = (draft.key || '').trim()
                const isEmpty = keyTrim.length === 0
                const isInvalidName = !isEmpty && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(keyTrim)
                const duplicate = items.some(
                  (it, i) =>
                    i !== editingIndex &&
                    (it.key || '').trim().toLowerCase() === keyTrim.toLowerCase()
                )
                const keyErrorMsg = isEmpty
                  ? 'Заполните ключ'
                  : isInvalidName
                    ? 'Ключ должен соответствовать: [A-Za-z_][A-Za-z0-9_]*'
                    : duplicate
                      ? 'Ключ должен быть уникальным'
                      : ''
                return (
                  <Field>
                    <FieldLabel htmlFor={keyId}>Ключ</FieldLabel>
                    <FieldContent>
                      <Input
                        id={keyId}
                        className={`${isEmpty || isInvalidName || duplicate ? 'border-red-500' : ''}`}
                        placeholder="ключ (имя переменной)"
                        aria-invalid={isEmpty || isInvalidName || duplicate}
                        value={draft.key}
                        onChange={(e) => {
                          const raw = e.target.value
                          const cleaned = raw.replace(/[^A-Za-z0-9_]/g, '')
                          setDraft({ ...draft, key: cleaned })
                        }}
                      />
                    </FieldContent>
                    {(isEmpty || isInvalidName || duplicate) && (
                      <FieldError errors={[{ message: keyErrorMsg }]} />
                    )}
                  </Field>
                )
              })()}

              {(() => {
                const typeId = `param-type`
                return (
                  <Field>
                    <FieldLabel htmlFor={typeId}>Тип</FieldLabel>
                    <FieldContent>
                      <Select
                        value={draft.type}
                        onValueChange={(v) =>
                          setDraft({ ...draft, type: v as ParamType, value: undefined })
                        }
                      >
                        <SelectTrigger id={typeId} className="min-w-32 h-8" title="Тип параметра">
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
                    </FieldContent>
                  </Field>
                )
              })()}

              {(() => {
                const valueId = `param-value`
                return (
                  <Field>
                    <FieldLabel htmlFor={valueId}>Значение</FieldLabel>
                    <FieldContent>
                      {draft.type === 'string' && (
                        <Input
                          id={valueId}
                          className="h-8 w-full"
                          placeholder="значение"
                          title="Строковое значение"
                          value={String(draft.value ?? '')}
                          onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                        />
                      )}

                      {draft.type === 'number' && (
                        <NumberValueEditor
                          id={valueId}
                          value={typeof draft.value === 'number' ? draft.value : undefined}
                          onChange={(num) => setDraft({ ...draft, value: num })}
                        />
                      )}

                      {draft.type === 'boolean' && (
                        <Select
                          value={String(Boolean(draft.value))}
                          onValueChange={(v) => setDraft({ ...draft, value: v === 'true' })}
                        >
                          <SelectTrigger
                            id={valueId}
                            className="h-8 w-full"
                            title="Булево значение"
                          >
                            <SelectValue placeholder="значение" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">true</SelectItem>
                            <SelectItem value="false">false</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {draft.type === 'date' && (
                        <DateValueEditor
                          value={
                            isDateValue(draft.value) ? (draft.value as DateParamValue) : undefined
                          }
                          onChange={(val) => setDraft({ ...draft, value: val })}
                        />
                      )}
                    </FieldContent>
                  </Field>
                )
              })()}
            </div>
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="button" onClick={saveDraft}>
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </FieldContent>
    </Field>
  )
}

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

function renderValueSummary(item: ParamItem): string {
  if (item.type === 'string') return String(item.value ?? '')
  if (item.type === 'number') return typeof item.value === 'number' ? String(item.value) : ''
  if (item.type === 'boolean') return String(Boolean(item.value))
  if (item.type === 'date') {
    const v = item.value as any
    if (!v || typeof v !== 'object' || !v.type) return ''
    if (v.type === 'exact') return v.date || ''
    if (v.type === 'add' || v.type === 'subtract') {
      const ops = Array.isArray(v.ops) ? v.ops : []
      const label = v.type === 'add' ? 'Прибавить' : 'Отнять'
      const parts = ops.map((o: any) => `${Number(o?.amount) || 1} ${String(o?.unit || 'day')}`)
      return `${label}: ${parts.join(', ')}`
    }
    if (v.type === 'startOf' || v.type === 'endOf') {
      const label = v.type === 'startOf' ? 'Начало' : 'Конец'
      const unit = String(v.unit || '')
      const pos = String(v.position || 'current')
      return `${label}: ${unit}, ${pos}`
    }
    return ''
  }
  return ''
}

function NumberValueEditor({
  id,
  value,
  onChange,
}: {
  id?: string
  value?: number
  onChange: (v: number) => void
}) {
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
      id={id}
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
  const [isOpen, setIsOpen] = useState(false)
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
        <SelectTrigger className="min-w-40" title="Операция даты">
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
                <SelectTrigger className="min-w-40" title="Единица измерения">
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
                className="ml-auto p-2"
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
            <SelectTrigger className="min-w-40" title="Единица (граница)">
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
            <SelectTrigger className="min-w-40" title="Период">
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
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 w-full justify-start">
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
                if (d) {
                  setExactDate(formatDate(d, 'yyyy-MM-dd'))
                  setIsOpen(false)
                }
              }}
              showOutsideDays
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

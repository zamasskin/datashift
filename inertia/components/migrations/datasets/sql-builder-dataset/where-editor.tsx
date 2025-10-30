import { PlusIcon, TrashIcon, X } from 'lucide-react'
import { useState } from 'react'
import { Autocomplete } from '~/components/ui/autocomplete'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Item, ItemContent } from '~/components/ui/item'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const whereOperators = ['=', '!=', '<>', '>', '>=', '<', '<=', 'in', 'nin'] as const

type Operators = (typeof whereOperators)[number]
type WhereField = {
  key: string
  value?: string
  values?: string[]
  op?: Operators
}

export type WhereData = {
  fields?: WhereField[]
  $and?: WhereData
  $or?: WhereData
}

export type WhereEditorProps = {
  data?: WhereData
  suggestionKeys?: string[]
  suggestionValues?: string[]
  onChange?: (newData: WhereData) => void
}

export function WhereEditor({
  data,
  suggestionKeys,
  suggestionValues,
  onChange,
}: WhereEditorProps) {
  const handleAddCondition = (newField: WhereField) => {
    if (onChange) {
      const fields = data?.fields || []
      onChange({ ...data, fields: [...fields, newField] })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {data?.fields?.map((field, idx) => (
          <Item key={idx} variant="outline">
            <ItemContent>
              <FieldWhere
                suggestionKeys={suggestionKeys}
                suggestionValues={suggestionValues}
                field={field}
                onDelete={() => {
                  if (onChange) {
                    const fields = data?.fields?.filter((_, i) => i !== idx)
                    onChange({ ...data, fields })
                  }
                }}
                onChange={(newField) => {
                  if (onChange) {
                    const fields = data?.fields || []
                    fields[idx] = newField
                    onChange({ ...data, fields })
                  }
                }}
              />
            </ItemContent>
          </Item>
        ))}
      </div>

      <ActionsWhere
        openedAnd={!!data?.$and}
        openedOr={!!data?.$or}
        suggestionKeys={suggestionKeys}
        suggestionValues={suggestionValues}
        onChangeOpenedAnd={(opened) => {
          if (onChange) {
            if (opened) {
              onChange({ ...data, $and: undefined })
            } else {
              onChange({ ...data, $and: {} })
            }
          }
        }}
        onChangeOpenedOr={(opened) => {
          if (onChange) {
            if (opened) {
              onChange({ ...data, $or: undefined })
            } else {
              onChange({ ...data, $or: {} })
            }
          }
        }}
        onAddCondition={handleAddCondition}
      />

      {data?.$and && (
        <Item variant="outline">
          <ItemContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="px-4">AND</Badge>
                <div className="text-xs text-muted-foreground">Все условия должны выполниться</div>
              </div>
              <div className="rounded-md bg-muted/40 p-2 border border-border">
                <WhereEditor
                  suggestionKeys={suggestionKeys}
                  suggestionValues={suggestionValues}
                  data={data.$and}
                  onChange={(newData) => {
                    if (onChange) {
                      onChange({ ...data, $and: newData })
                    }
                  }}
                />
              </div>
            </div>
          </ItemContent>
        </Item>
      )}

      {data?.$or && (
        <Item variant="outline">
          <ItemContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="px-4">OR</Badge>
                <div className="text-xs text-muted-foreground">Должно выполниться хотя бы одно</div>
              </div>
              <div className="rounded-md bg-muted/40 p-2 border border-border">
                <WhereEditor
                  suggestionKeys={suggestionKeys}
                  suggestionValues={suggestionValues}
                  data={data.$or}
                  onChange={(newData) => {
                    if (onChange) {
                      onChange({ ...data, $or: newData })
                    }
                  }}
                />
              </div>
            </div>
          </ItemContent>
        </Item>
      )}
    </div>
  )
}

export type FieldProps = {
  field: WhereField
  suggestionKeys?: string[]
  suggestionValues?: string[]
  onDelete?: () => void
  onChange?: (data: WhereField) => void
}

export function FieldWhere({
  field,
  suggestionKeys,
  suggestionValues,
  onDelete,
  onChange,
}: FieldProps) {
  const opValue = field.op || '='
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex-1 min-w-[220px]">
        <Autocomplete
          suggestions={suggestionKeys}
          id="key"
          value={field.key}
          onValueChange={(value) => {
            if (onChange) {
              onChange({ ...field, key: value })
            }
          }}
          placeholder="поле (таблица.колонка)"
        />
      </div>

      <Select
        value={opValue as Operators}
        onValueChange={(value: Operators) => {
          if (onChange) {
            onChange({ ...field, op: value })
          }
        }}
      >
        <SelectTrigger className="h-8 min-w-20" title="Оператор">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {whereOperators.map((op) => (
            <SelectItem key={op} value={op}>
              {op}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {opValue === 'in' || opValue === 'nin' ? (
        <div className="flex flex-wrap items-center gap-2">
          {field.values?.map((value, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <Autocomplete
                suggestions={suggestionValues}
                id={`value-${idx}`}
                value={value}
                onValueChange={(val) => {
                  if (onChange) {
                    const values = field.values || []
                    values[idx] = val
                    onChange({ ...field, values })
                  }
                }}
                className="h-8 min-w-[180px]"
                placeholder="значение"
              />
              {field?.values && field?.values.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onChange) {
                      const values = (field.values || []).filter((_, i) => i !== idx)
                      onChange({ ...field, values })
                    }
                  }}
                >
                  <X />
                </Button>
              )}
            </div>
          ))}

          <Button
            size="sm"
            onClick={() => {
              if (onChange) {
                const values = field.values || []
                onChange({ ...field, values: [...values, ''] })
              }
            }}
          >
            <PlusIcon className="size-4" /> Добавить
          </Button>
        </div>
      ) : (
        <div className="flex-1 min-w-[220px]">
          <Autocomplete
            suggestions={suggestionValues}
            id="value"
            value={field.value}
            onValueChange={(value) => {
              if (onChange) {
                onChange({ ...field, value })
              }
            }}
            placeholder="значение"
          />
        </div>
      )}

      <Button variant="secondary" size="sm" className="h-8" onClick={onDelete}>
        <TrashIcon className="size-4" /> Удалить
      </Button>
    </div>
  )
}

export type ActionsWhereProps = {
  openedAnd?: boolean
  openedOr?: boolean
  suggestionKeys?: string[]
  suggestionValues?: string[]
  onAddCondition?: (newItem: WhereField) => void
  onChangeOpenedAnd?: (open: boolean) => void
  onChangeOpenedOr?: (open: boolean) => void
}

export function ActionsWhere({
  openedAnd,
  openedOr,
  suggestionKeys,
  suggestionValues,
  onAddCondition,
  onChangeOpenedAnd,
  onChangeOpenedOr,
}: ActionsWhereProps) {
  const [newCondOpen, changeNewCondOpen] = useState(false)
  const [newCondKey, seNewtCondKey] = useState('')
  const [newCondOp, setNewCondOp] = useState<Operators>('=')
  const [newCondValue, setNewCondValue] = useState('')
  const [newCondValues, setNewCondValues] = useState([''])
  const [newCondErr, setNewCondErr] = useState('')

  const handleAdd = () => {
    setNewCondErr('')
    //TODO: Написать функцию которая добавляет условия
    if (!newCondKey) {
      setNewCondErr('Ключ не должен быть пустым')
      return
    }

    if (onAddCondition) {
      if (newCondOp == 'in' || newCondOp == 'nin') {
        onAddCondition({ key: newCondKey, value: '', values: newCondValues, op: newCondOp })
      } else {
        onAddCondition({ key: newCondKey, value: newCondValue, values: [], op: newCondOp })
      }
    }

    seNewtCondKey('')
    setNewCondOp('=')
    setNewCondValue('')
    setNewCondValues([''])
    changeNewCondOpen(false)
  }

  return (
    <div className="flex gap-1">
      <Popover open={newCondOpen} onOpenChange={changeNewCondOpen}>
        <PopoverTrigger asChild>
          <Button size="sm">
            <PlusIcon />
            Условие
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="rounded-xl text-sm">
          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="input-id">Поле</FieldLabel>
              <Autocomplete
                id="field"
                suggestions={suggestionKeys}
                value={newCondKey}
                onValueChange={(value) => seNewtCondKey(value)}
                className="col-span-2 h-8"
              />
            </Field>
            <Field>
              <Label htmlFor="op">Условие</Label>
              <Select value={newCondOp} onValueChange={(value: Operators) => setNewCondOp(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="=" />
                </SelectTrigger>
                <SelectContent>
                  {whereOperators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="value">Значение</Label>
              {newCondOp == 'in' || newCondOp == 'nin' ? (
                <div className="flex flex-col gap-2 justify-end">
                  {newCondValues.map((v, idx) => (
                    <div className="flex gap-1" key={idx}>
                      <Autocomplete
                        value={v}
                        suggestions={suggestionValues}
                        onValueChange={(value) => {
                          const updated = [...newCondValues]
                          updated[idx] = value
                          setNewCondValues(updated)
                        }}
                        className="col-span-2 h-8"
                      />

                      {newCondValues.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updated = newCondValues.filter((_, i) => i !== idx)
                            setNewCondValues(updated)
                          }}
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button onClick={() => setNewCondValues((old) => [...old, ''])}>
                    <PlusIcon className="size-4" /> Добавить
                  </Button>
                </div>
              ) : (
                <Autocomplete
                  suggestions={suggestionValues}
                  value={newCondValue.toString()}
                  onValueChange={(value) => setNewCondValue(value)}
                  id="value"
                  className="col-span-2 h-8"
                />
              )}
            </Field>

            {newCondErr && <FieldError>{newCondErr}</FieldError>}

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => changeNewCondOpen(false)}>
                Закрыть
              </Button>
              <Button onClick={handleAdd}>Добавить</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {openedAnd ? (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onChangeOpenedAnd && onChangeOpenedAnd(true)}
        >
          <TrashIcon />
          And
        </Button>
      ) : (
        <Button size="sm" onClick={() => onChangeOpenedAnd && onChangeOpenedAnd(false)}>
          <PlusIcon />
          And
        </Button>
      )}

      {openedOr ? (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onChangeOpenedOr && onChangeOpenedOr(true)}
        >
          <TrashIcon />
          Or
        </Button>
      ) : (
        <Button size="sm" onClick={() => onChangeOpenedOr && onChangeOpenedOr(false)}>
          <PlusIcon />
          Or
        </Button>
      )}
    </div>
  )
}

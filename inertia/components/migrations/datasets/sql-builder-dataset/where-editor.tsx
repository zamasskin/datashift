import { BrushCleaning, Plus, Trash, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { ButtonGroup } from '~/components/ui/button-group'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
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
  onChange?: (newData: WhereData) => void
}

export function WhereEditor({ data, onChange }: WhereEditorProps) {
  const handleAddCondition = (newField: WhereField) => {
    if (onChange) {
      const fields = data?.fields || []
      onChange({ ...data, fields: [...fields, newField] })
    }
  }

  return (
    <div className="space-y-2">
      {data?.fields?.map((field, idx) => (
        <FieldWhere
          key={idx}
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
      ))}

      <ActionsWhere
        openedAnd={!!data?.$and}
        openedOr={!!data?.$or}
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
        <div className="space-y-2">
          <Badge className="px-4">And</Badge>
          <div className="ml-1 pl-2 border-l border-l-border">
            <WhereEditor
              data={data.$and}
              onChange={(newData) => {
                if (onChange) {
                  onChange({ ...data, $and: newData })
                }
              }}
            />
          </div>
        </div>
      )}

      {data?.$or && (
        <div className="space-y-2">
          <Badge className="px-4">Or</Badge>
          <div className="ml-1 pl-2 border-l border-l-border">
            <WhereEditor
              data={data.$or}
              onChange={(newData) => {
                if (onChange) {
                  onChange({ ...data, $or: newData })
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export type FieldProps = {
  field: WhereField
  onDelete?: () => void
  onChange?: (data: WhereField) => void
}

export function FieldWhere({ field, onDelete, onChange }: FieldProps) {
  const [opPopoverOpened, handleOpPopoverOpened] = useState(false)
  return (
    <div className="flex gap-1">
      <ButtonGroup>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm">
              {field.key}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="rounded-xl text-sm">
            <Input
              id="field"
              value={field.key}
              onChange={(ev) => {
                if (onChange) {
                  onChange({ ...field, key: ev.target.value })
                }
              }}
            />
          </PopoverContent>
        </Popover>

        <Popover open={opPopoverOpened} onOpenChange={handleOpPopoverOpened}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm">
              {field.op || '='}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="rounded-xl text-sm w-16 p-0">
            <div className="flex flex-col gap-1">
              {whereOperators.map((op) => (
                <Button
                  key={op}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onChange) {
                      onChange({ ...field, op: op })
                      handleOpPopoverOpened(false)
                    }
                  }}
                >
                  {op}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" className="truncate">
              {field.op == 'in' || field.op == 'nin'
                ? field.values?.join(',')
                : field.value?.toString()}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="rounded-xl text-sm">
            {field.op == 'in' || field.op == 'nin' ? (
              <div className="space-y-2">
                {field.values?.map((value, idx) => (
                  <ButtonGroup key={idx}>
                    <Input
                      id="field"
                      value={value}
                      onChange={(ev) => {
                        if (onChange) {
                          const values = field.values || []
                          values[idx] = ev.target.value
                          onChange({ ...field, values })
                        }
                      }}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (onChange) {
                          const values = field.values || []
                          values[idx] = ''
                          onChange({ ...field, values })
                        }
                      }}
                    >
                      <BrushCleaning />
                    </Button>

                    {field?.values && field?.values.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (onChange) {
                            const values = field?.values?.filter((_, i) => i !== idx) || []
                            onChange({ ...field, values })
                          }
                        }}
                      >
                        <X />
                      </Button>
                    )}
                  </ButtonGroup>
                ))}
                <Button
                  onClick={() => {
                    if (onChange) {
                      const values = field.values || []
                      onChange({ ...field, values: [...values, ''] })
                    }
                  }}
                >
                  <Plus />
                  Добавить
                </Button>
              </div>
            ) : (
              <Input
                id="field"
                value={field.value}
                onChange={(ev) => {
                  if (onChange) {
                    onChange({ ...field, value: ev.target.value })
                  }
                }}
              />
            )}
          </PopoverContent>
        </Popover>
      </ButtonGroup>

      <Button size="sm" variant="destructive" onClick={onDelete}>
        <X />
      </Button>
    </div>
  )
}

export type ActionsWhereProps = {
  openedAnd?: boolean
  openedOr?: boolean
  onAddCondition?: (newItem: WhereField) => void
  onChangeOpenedAnd?: (open: boolean) => void
  onChangeOpenedOr?: (open: boolean) => void
}

export function ActionsWhere({
  openedAnd,
  openedOr,
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
            <Plus />
            Условие
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="rounded-xl text-sm">
          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="input-id">Поле</FieldLabel>
              <Input
                id="field"
                value={newCondKey}
                onChange={(ev) => seNewtCondKey(ev.target.value)}
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
                    <ButtonGroup key={idx}>
                      <Input
                        value={v}
                        onChange={(ev) => {
                          const updated = [...newCondValues]
                          updated[idx] = ev.target.value as string
                          setNewCondValues(updated)
                        }}
                        className="col-span-2 h-8"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = [...newCondValues]
                          updated[idx] = ''
                          setNewCondValues(updated)
                        }}
                      >
                        <BrushCleaning />
                      </Button>

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
                    </ButtonGroup>
                  ))}

                  <Button onClick={() => setNewCondValues((old) => [...old, ''])}>
                    <Plus /> Добавить
                  </Button>
                </div>
              ) : (
                <Input
                  value={newCondValue.toString()}
                  onChange={(ev) => setNewCondValue(ev.target.value)}
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
          <Trash />
          And
        </Button>
      ) : (
        <Button size="sm" onClick={() => onChangeOpenedAnd && onChangeOpenedAnd(false)}>
          <Plus />
          And
        </Button>
      )}

      {openedOr ? (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onChangeOpenedOr && onChangeOpenedOr(true)}
        >
          <Trash />
          Or
        </Button>
      ) : (
        <Button size="sm" onClick={() => onChangeOpenedOr && onChangeOpenedOr(false)}>
          <Plus />
          Or
        </Button>
      )}
    </div>
  )
}

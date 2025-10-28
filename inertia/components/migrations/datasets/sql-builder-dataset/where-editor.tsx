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
type WhereRawValue = string | number | Date

type Operators = (typeof whereOperators)[number]
type WhereField = {
  key: string
  value?: WhereRawValue
  values?: WhereRawValue[]
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
}

export function FieldWhere({ field, onDelete }: FieldProps) {
  return (
    <div className="flex gap-1">
      <ButtonGroup>
        <Button variant="secondary" size="sm">
          {field.key}
        </Button>

        <Button variant="secondary" size="sm">
          {field.op || '='}
        </Button>
        <Button variant="secondary" size="sm">
          {field.op == 'in' || field.op == 'nin'
            ? field.values?.join(',')
            : field.value?.toString()}
        </Button>
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

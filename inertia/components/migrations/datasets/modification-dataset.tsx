import { useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel, FieldError } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '~/components/ui/dialog'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { Item, ItemContent } from '~/components/ui/item'

export type DatasetConfig = {
  id: string
  title: string
  columns: string[]
}

export type ModificationDatasetProps = {
  children?: React.ReactNode
  saveBtnName?: string
  isLoading?: boolean
  datasetsConfigs?: DatasetConfig[]
  config?: ModificationConfig
  onSave?: (config: ModificationConfig) => void
}

export function ModificationDataset(props: ModificationDatasetProps) {
  const initial = props.config

  const [open, setOpen] = useState(false)
  const [datasetId, setDatasetId] = useState(initial?.params?.datasetId || '')

  const datasets = useMemo(
    () => (props.datasetsConfigs || []).map((dc) => dc.id),
    [props.datasetsConfigs]
  )

  const datasetTitleMap = useMemo(
    () =>
      Object.fromEntries(
        (props.datasetsConfigs || []).map((dc) => [
          dc.id,
          dc.title ? `${dc.title} (${dc.id})` : dc.id,
        ])
      ),
    [props.datasetsConfigs]
  )

  const availableColumns = useMemo(() => {
    const cfg = (props.datasetsConfigs || []).find((dc) => dc.id === datasetId)
    return cfg?.columns || []
  }, [props.datasetsConfigs, datasetId])

  type RenamePair = { from: string; to: string }
  const [renamePairs, setRenamePairs] = useState<RenamePair[]>(() => {
    const map = initial?.params?.renameColumns || {}
    return Object.keys(map).map((k) => ({ from: k, to: map[k] }))
  })
  const [dropColumns, setDropColumns] = useState<string[]>(initial?.params?.dropColumns || [])
  const [newColumns, setNewColumns] = useState<ColumnValue[]>(initial?.params?.newColumns || [])

  const dropOptions = useMemo(
    () => availableColumns.filter((c) => !dropColumns.includes(c)),
    [availableColumns, dropColumns]
  )

  useEffect(() => {
    setDatasetId(initial?.params?.datasetId || '')
  }, [initial?.params?.datasetId])

  useEffect(() => {
    setDropColumns(initial?.params?.dropColumns || [])
  }, [initial?.params?.dropColumns])

  useEffect(() => {
    setRenamePairs(() => {
      const map = initial?.params?.renameColumns || {}
      return Object.keys(map).map((k) => ({ from: k, to: map[k] }))
    })
  }, [initial?.params?.renameColumns])

  useEffect(() => {
    setNewColumns(initial?.params?.newColumns || [])
  }, [initial?.params?.newColumns])

  const handleSave = () => {
    if (props.onSave) {
      const renameMap = Object.fromEntries(
        renamePairs
          .filter((p) => p.from.trim() && p.to.trim())
          .map((p) => [p.from.trim(), p.to.trim()])
      )
      const params = {
        datasetId: datasetId.trim(),
        dropColumns: dropColumns.filter((c) => !!c.trim()),
        renameColumns: renameMap,
        newColumns: newColumns,
      }

      if (props.config) {
        props.onSave({ ...props.config, params })
      } else {
        props.onSave({ type: 'modification', id: Date.now().toString(36), params })
      }
      setOpen(false)
    }
  }

  const [newDropName, setNewDropName] = useState('')
  const addDropColumn = () => {
    const v = newDropName.trim()
    if (!v) return
    setDropColumns((prev) => (prev.includes(v) ? prev : [...prev, v]))
    setNewDropName('')
  }

  const removeDropColumn = (idx: number) => {
    setDropColumns((prev) => prev.filter((_, i) => i !== idx))
  }

  const addRenamePair = () => {
    setRenamePairs((prev) => [...prev, { from: '', to: '' }])
  }

  const patchRenamePair = (idx: number, patch: Partial<RenamePair>) => {
    setRenamePairs((prev) => {
      const next = prev.slice()
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }

  const removeRenamePair = (idx: number) => {
    setRenamePairs((prev) => prev.filter((_, i) => i !== idx))
  }

  const addNewColumn = () => {
    setNewColumns((prev) => [...prev, { type: 'reference', value: '' } as ColumnReference])
  }

  const patchNewColumn = (idx: number, patch: ColumnValue) => {
    setNewColumns((prev) => {
      const next = prev.slice()
      next[idx] = patch
      return next
    })
  }

  const removeNewColumn = (idx: number) => {
    setNewColumns((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.children ? (
          props.children
        ) : (
          <Button size="sm" variant="outline">
            Настроить
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[75vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Модификация датасета</DialogTitle>
        </DialogHeader>
        <ScrollArea className=" w-full">
          <div className="space-y-4 py-2">
            <Field>
              <FieldLabel>Датасет</FieldLabel>
              <Select value={datasetId} onValueChange={setDatasetId}>
                <SelectTrigger className="min-w-40 h-8" title="Датасет">
                  <SelectValue placeholder="Выберите датасет" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.length > 0 ? (
                    datasets.map((s) => (
                      <SelectItem key={s} value={s}>
                        {datasetTitleMap[s] || s}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_datasets__" disabled>
                      Нет вариантов
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!datasetId.trim() && <FieldError>Укажите идентификатор датасета</FieldError>}
            </Field>

            <Tabs defaultValue="new" className="w-full">
              <TabsList>
                <TabsTrigger value="new">Добавить</TabsTrigger>
                <TabsTrigger value="rename">Переименовать</TabsTrigger>
                <TabsTrigger value="drop">Удалить</TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-3">
                <Field>
                  <FieldLabel>Новые колонки</FieldLabel>
                  <ScrollArea className="h-36 w-full">
                    <div className="space-y-2 py-2">
                      {newColumns.map((col, idx) => (
                        <ColumnValueEditor
                          key={idx}
                          value={col}
                          onChange={(v) => patchNewColumn(idx, v)}
                          onRemove={() => removeNewColumn(idx)}
                          columns={availableColumns}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                  <Button type="button" variant="outline" onClick={addNewColumn}>
                    <PlusIcon className="mr-1" /> Добавить колонку
                  </Button>
                </Field>
              </TabsContent>

              <TabsContent value="rename" className="mt-3">
                <Field>
                  <FieldLabel>Переименовать колонки</FieldLabel>
                  <ScrollArea className="h-28 w-full">
                    <div className="space-y-2 py-2">
                      {renamePairs.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Select
                            value={p.from}
                            onValueChange={(v) => patchRenamePair(idx, { from: v })}
                          >
                            <SelectTrigger className="min-w-40 h-8" title="Старая колонка">
                              <SelectValue placeholder="old_name" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColumns.length > 0 ? (
                                availableColumns.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="__no_columns__" disabled>
                                  Нет колонок
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="new_name"
                            value={p.to}
                            onChange={(e) => patchRenamePair(idx, { to: e.target.value })}
                            className="h-8"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRenamePair(idx)}
                            title="Удалить"
                            className="h-7 w-7"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button type="button" variant="outline" onClick={addRenamePair}>
                    <PlusIcon className="mr-1" /> Добавить переименование
                  </Button>
                </Field>
              </TabsContent>

              <TabsContent value="drop" className="mt-3">
                <Field>
                  <FieldLabel>Удалить колонки</FieldLabel>
                  <div className="flex gap-2">
                    <Select value={newDropName} onValueChange={setNewDropName}>
                      <SelectTrigger className="min-w-40 h-8" title="Колонка">
                        <SelectValue placeholder="Выберите колонку" />
                      </SelectTrigger>
                      <SelectContent>
                        {dropOptions.length > 0 ? (
                          dropOptions.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__no_columns__" disabled>
                            Нет колонок
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="secondary" onClick={addDropColumn}>
                      Добавить
                    </Button>
                  </div>
                  <ScrollArea className="h-24 w-full">
                    <div className="flex flex-wrap gap-2 py-2">
                      {dropColumns.map((c, idx) => (
                        <div
                          key={`${c}-${idx}`}
                          className="flex items-center gap-2 border rounded px-2 py-1"
                        >
                          <span className="text-sm font-mono">{c}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDropColumn(idx)}
                            title="Удалить"
                            className="h-7 w-7"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Field>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Закрыть</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={props.isLoading || !datasetId.trim()}>
            {props.saveBtnName || 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ColumnTemplate = {
  type: 'template'
  value: string
}

type ColumnExpression = {
  type: 'expression'
  value: string
}

type ColumnLiteral = {
  type: 'literal'
  value: string | number | boolean
}

type ColumnReference = {
  type: 'reference'
  value: string // column name
}

type ColumnFunction = {
  type: 'function'
  name: string
  args: ColumnValue[]
}

type ColumnValue =
  | ColumnTemplate
  | ColumnExpression
  | ColumnLiteral
  | ColumnReference
  | ColumnFunction

type ModificationConfig = {
  type: 'modification'
  id: string
  params: {
    datasetId: string
    // Column extension options
    newColumns?: ColumnValue[]
    dropColumns?: string[] // List of column names to remove
    renameColumns?: Record<string, string> // Map oldName -> newName
  }
}

function ColumnValueEditor({
  value,
  onChange,
  onRemove,
  columns,
}: {
  value: ColumnValue
  onChange: (v: ColumnValue) => void
  onRemove: () => void
  columns?: string[]
}) {
  const type = value.type

  const setType = (t: ColumnValue['type']) => {
    switch (t) {
      case 'template':
        onChange({ type: 'template', value: '' })
        break
      case 'expression':
        onChange({ type: 'expression', value: '' })
        break
      case 'literal':
        onChange({ type: 'literal', value: '' })
        break
      case 'reference':
        onChange({ type: 'reference', value: '' })
        break
      case 'function':
        onChange({ type: 'function', name: '', args: [] })
        break
    }
  }

  const setLiteralValue = (v: string) => {
    const trimmed = v.trim()
    if (trimmed === 'true' || trimmed === 'false') {
      onChange({ type: 'literal', value: trimmed === 'true' })
    } else if (!Number.isNaN(Number(trimmed)) && trimmed !== '') {
      onChange({ type: 'literal', value: Number(trimmed) })
    } else {
      onChange({ type: 'literal', value: v })
    }
  }

  const setTemplateValue = (v: string) => onChange({ type: 'template', value: v })
  const setExpressionValue = (v: string) => onChange({ type: 'expression', value: v })
  const setReferenceValue = (v: string) => onChange({ type: 'reference', value: v })
  const setFunctionName = (v: string) =>
    onChange({ type: 'function', name: v, args: (value as ColumnFunction).args || [] })
  const setFunctionArgsJson = (text: string) => {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        onChange({
          type: 'function',
          name: (value as ColumnFunction).name || '',
          args: parsed as ColumnValue[],
        })
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  return (
    <Item variant="outline" className="w-full items-start gap-1 py-3 px-3">
      <ItemContent>
        <div className="flex justify-between">
          <Select value={type} onValueChange={(t) => setType(t as ColumnValue['type'])}>
            <SelectTrigger className="min-w-40 h-8">
              <SelectValue placeholder="Тип значения" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reference">ссылка</SelectItem>
              <SelectItem value="literal">литерал</SelectItem>
              <SelectItem value="template">шаблон</SelectItem>
              <SelectItem value="expression">выражение</SelectItem>
              <SelectItem value="function" disabled title="Скоро">
                функция (скоро)
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Удалить"
            onClick={onRemove}
            className="h-7 w-7"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>

        {type === 'reference' &&
          (columns && columns.length > 0 ? (
            <Select
              value={(value as ColumnReference).value as string}
              onValueChange={(v) => setReferenceValue(v)}
            >
              <SelectTrigger className="min-w-40 h-8" title="column name">
                <SelectValue placeholder="column name" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="column name"
              value={(value as ColumnReference).value as string}
              onChange={(e) => setReferenceValue(e.target.value)}
              className="h-8"
            />
          ))}

        {type === 'literal' && (
          <Input
            placeholder="string | number | boolean"
            value={String((value as ColumnLiteral).value ?? '')}
            onChange={(e) => setLiteralValue(e.target.value)}
            className="h-8"
          />
        )}

        {type === 'template' && (
          <Textarea
            placeholder="template string"
            value={(value as ColumnTemplate).value as string}
            onChange={(e) => setTemplateValue(e.target.value)}
            className="min-h-24"
          />
        )}

        {type === 'expression' && (
          <Textarea
            placeholder="expression"
            value={(value as ColumnExpression).value as string}
            onChange={(e) => setExpressionValue(e.target.value)}
            className="min-h-24"
          />
        )}

        {type === 'function' && (
          <div className="flex flex-col gap-2 w-full">
            <div className="text-sm text-muted-foreground">Поддержка функций появится скоро.</div>
          </div>
        )}
      </ItemContent>
    </Item>
  )
}

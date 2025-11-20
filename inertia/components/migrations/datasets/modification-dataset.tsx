import { useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel, FieldError } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
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
import { Checkbox } from '~/components/ui/checkbox'
import { ExpressionEditor } from '../expression-editor'
import { TemplateEditor } from '../template-editor'
import {
  ColumnExpression,
  ColumnLiteral,
  ColumnReference,
  ColumnTemplate,
  ColumnValue,
  ModificationConfig,
} from '#interfaces/modification_config'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useI18n } from '~/hooks/useI18nLocal'

export type ModificationDatasetProps = {
  children?: React.ReactNode
  saveBtnName?: string
  isLoading?: boolean
  suggestions?: Record<string, string[]>
  config?: ModificationConfig
  onSave?: (config: ModificationConfig) => void
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export function ModificationDataset(props: ModificationDatasetProps) {
  const { t } = useI18n()
  const initial = props.config

  const [open, setOpen] = useState(false)
  const [datasetId, setDatasetId] = useState(initial?.params?.datasetId || '')

  const datasets = useMemo(() => {
    const keys = Object.keys(props.suggestions || {})
    return keys.filter((k) => k && k !== 'params')
  }, [props.suggestions])

  const datasetTitleMap = useMemo(() => {
    const ids = Object.keys(props.suggestions || {}).filter((k) => k && k !== 'params')
    return Object.fromEntries(ids.map((id) => [id, id]))
  }, [props.suggestions])

  const availableColumns = useMemo(() => {
    const columns = (props.suggestions || {})[datasetId]
    return Array.isArray(columns) ? columns : []
  }, [props.suggestions, datasetId])

  const availableParams = useMemo(() => {
    const params = (props.suggestions || {})['params']
    return Array.isArray(params) ? params : []
  }, [props.suggestions])

  type RenamePair = { from: string; to: string }
  const [renamePairs, setRenamePairs] = useState<RenamePair[]>(() => {
    const map = initial?.params?.renameColumns || {}
    return Object.keys(map).map((k) => ({ from: k, to: map[k] }))
  })
  const [dropColumns, setDropColumns] = useState<string[]>(initial?.params?.dropColumns || [])
  const [bulkDropSelection, setBulkDropSelection] = useState<string[]>([])
  type NewColumnUI = { name: string; value: ColumnValue }
  const [newColumns, setNewColumns] = useState<NewColumnUI[]>(() => {
    const raw = (initial?.params?.newColumns || []) as any[]
    return raw.map((item) =>
      item && typeof item === 'object' && 'type' in item
        ? { name: '', value: item as ColumnValue }
        : {
            name: String(item?.name || ''),
            value: (item?.value || { type: 'reference', value: '' }) as ColumnValue,
          }
    )
  })

  const [activeNewIdx, setActiveNewIdx] = useState<number | null>(null)

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
    const raw = (initial?.params?.newColumns || []) as any[]
    const normalized = raw.map((item) =>
      item && typeof item === 'object' && 'type' in item
        ? { name: '', value: item as ColumnValue }
        : {
            name: String(item?.name || ''),
            value: (item?.value || { type: 'reference', value: '' }) as ColumnValue,
          }
    )
    setNewColumns(normalized)
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
        newColumns: newColumns.map((c) => ({ name: c.name.trim(), value: c.value })),
      }

      if (props.config) {
        props.onSave({ ...props.config, params })
      } else {
        props.onSave({ type: 'modification', id: Date.now().toString(36), params })
      }
      if (props?.onOpenChange) props.onOpenChange(false)
      setOpen(false)
    }
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
    setNewColumns((prev) => {
      const next = [
        ...prev,
        { name: '', value: { type: 'reference', value: '' } as ColumnReference },
      ]
      setActiveNewIdx(next.length - 1)
      return next
    })
  }

  const patchNewColumnValue = (idx: number, patch: ColumnValue) => {
    setNewColumns((prev) => {
      const next = prev.slice()
      next[idx] = { ...next[idx], value: patch }
      return next
    })
  }

  const patchNewColumnName = (idx: number, name: string) => {
    setNewColumns((prev) => {
      const next = prev.slice()
      next[idx] = { ...next[idx], name }
      return next
    })
  }

  const removeNewColumn = (idx: number) => {
    setNewColumns((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      setActiveNewIdx((active) => {
        if (active == null) return active
        if (active === idx) return next.length ? Math.min(idx, next.length - 1) : null
        if (active > idx) return active - 1
        return active
      })
      return next
    })
  }

  return (
    <Dialog open={props.open || open} onOpenChange={props.onOpenChange || setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[85vh] overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>
            {String(t('datasets.modification.name', 'Модификация'))}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field>
            <FieldLabel>{String(t('datasets.modification.datasetLabel', 'Датасет'))}</FieldLabel>
            <Select value={datasetId} onValueChange={setDatasetId}>
              <SelectTrigger
                className="min-w-40 h-8"
                title={String(t('datasets.modification.datasetLabel', 'Датасет'))}
              >
                <SelectValue
                  placeholder={String(
                    t('datasets.modification.selectPlaceholder', 'Выберите датасет')
                  )}
                />
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
                    {String(t('datasets.modification.noOptions', 'Нет вариантов'))}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {!datasetId.trim() && (
              <FieldError>
                {String(
                  t('datasets.modification.datasetErrorRequired', 'Укажите идентификатор датасета')
                )}
              </FieldError>
            )}
          </Field>

          <Tabs defaultValue="new" className="w-full">
            <TabsList>
              <TabsTrigger value="new">
                {String(t('datasets.modification.tabs.new', 'Добавить'))}
              </TabsTrigger>
              <TabsTrigger value="rename">
                {String(t('datasets.modification.tabs.rename', 'Переименовать'))}
              </TabsTrigger>
              <TabsTrigger value="drop">
                {String(t('datasets.modification.tabs.drop', 'Удалить'))}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-3">
              <Field>
                <FieldLabel>
                  {String(t('datasets.modification.newColumnsLabel', 'Новые колонки'))}
                </FieldLabel>
                <div className="space-y-2 py-2">
                  {newColumns.map((col, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="new_column_name"
                          value={col.name}
                          onChange={(e) => patchNewColumnName(idx, e.target.value)}
                          className="h-8"
                        />
                        {activeNewIdx === idx ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveNewIdx(null)}
                          >
                            {String(t('datasets.modification.hideBtnName', 'Скрыть'))}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveNewIdx(idx)}
                          >
                            {String(t('datasets.modification.editBtnName', 'Редактировать'))}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={String(
                            t('datasets.modification.deleteColumnTitle', 'Удалить колонку')
                          )}
                          onClick={() => removeNewColumn(idx)}
                          className="h-7 w-7"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      {activeNewIdx === idx && (
                        <ColumnValueEditor
                          value={col.value}
                          onChange={(v) => patchNewColumnValue(idx, v)}
                          onRemove={() => removeNewColumn(idx)}
                          columns={availableColumns}
                          params={availableParams}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" onClick={addNewColumn}>
                  <PlusIcon className="mr-1" />{' '}
                  {String(t('datasets.modification.addColumnBtnName', 'Добавить колонку'))}
                </Button>
              </Field>
            </TabsContent>

            <TabsContent value="rename" className="mt-3">
              <Field>
                <FieldLabel>
                  {String(t('datasets.modification.renameColumnsLabel', 'Переименовать колонки'))}
                </FieldLabel>
                <div className="max-h-72 max-w-full overflow-scroll">
                  <ScrollArea>
                    <div className="space-y-2 py-2">
                      {renamePairs.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Select
                            value={p.from}
                            onValueChange={(v) => patchRenamePair(idx, { from: v })}
                          >
                            <SelectTrigger
                              className="min-w-40 h-8"
                              title={String(
                                t('datasets.modification.oldColumnLabel', 'Старая колонка')
                              )}
                            >
                              <SelectValue
                                placeholder={String(
                                  t('datasets.modification.oldNamePlaceholder', 'old_name')
                                )}
                              />
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
                                  {String(t('datasets.modification.noColumns', 'Нет колонок'))}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder={String(
                              t('datasets.modification.newNamePlaceholder', 'new_name')
                            )}
                            value={p.to}
                            onChange={(e) => patchRenamePair(idx, { to: e.target.value })}
                            className="h-8"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRenamePair(idx)}
                            title={String(t('datasets.modification.deleteTitle', 'Удалить'))}
                            className="h-7 w-7"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Button type="button" variant="outline" onClick={addRenamePair}>
                  <PlusIcon className="mr-1" />{' '}
                  {String(t('datasets.modification.addRenameBtnName', 'Добавить переименование'))}
                </Button>
              </Field>
            </TabsContent>

            <TabsContent value="drop" className="mt-3">
              <Field>
                <FieldLabel>
                  {String(t('datasets.modification.dropColumnsLabel', 'Удалить колонки'))}
                </FieldLabel>
                <div className="max-h-48 max-w-full overflow-scroll border rounded-md p-2">
                  <ScrollArea>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-1">
                      {dropOptions.length > 0 ? (
                        dropOptions.map((c) => (
                          <label key={c} className="flex items-center gap-2">
                            <Checkbox
                              checked={bulkDropSelection.includes(c)}
                              onCheckedChange={(val) => {
                                const checked = Boolean(val)
                                setBulkDropSelection((prev) =>
                                  checked
                                    ? [...prev, c].filter((v, i, arr) => arr.indexOf(v) === i)
                                    : prev.filter((x) => x !== c)
                                )
                              }}
                              aria-label={c}
                            />
                            <span className="text-sm font-mono">{c}</span>
                          </label>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {String(t('datasets.modification.noColumns', 'Нет колонок'))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setBulkDropSelection(dropOptions)}
                    disabled={dropOptions.length === 0}
                  >
                    {String(t('datasets.modification.selectAllBtnName', 'Выделить все'))}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setDropColumns((prev) => [
                        ...prev,
                        ...bulkDropSelection.filter((c) => !prev.includes(c)),
                      ])
                      setBulkDropSelection([])
                    }}
                    disabled={bulkDropSelection.length === 0}
                  >
                    {String(t('datasets.modification.addSelectedBtnName', 'Добавить выбранные'))}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDropColumns([])}
                    disabled={dropColumns.length === 0}
                  >
                    {String(t('datasets.modification.clearListBtnName', 'Очистить список'))}
                  </Button>
                </div>
                <div className="max-h-72 max-w-full overflow-scroll">
                  <ScrollArea>
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
                            title={String(t('datasets.modification.deleteTitle', 'Удалить'))}
                            className="h-7 w-7"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </Field>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">
              {String(t('datasets.modification.closeBtnName', 'Закрыть'))}
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={props.isLoading || !datasetId.trim()}>
            {props.saveBtnName || String(t('datasets.modification.saveBtnName', 'Сохранить'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ColumnValueEditor({
  value,
  onChange,
  onRemove,
  columns,
  params,
}: {
  value: ColumnValue
  onChange: (v: ColumnValue) => void
  onRemove: () => void
  columns?: string[]
  params?: string[]
}) {
  const { t } = useI18n()
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

  return (
    <Item variant="outline" className="w-full items-start gap-1 py-3 px-3">
      <ItemContent>
        <div className="flex justify-between">
          <Select value={type} onValueChange={(t) => setType(t as ColumnValue['type'])}>
            <SelectTrigger className="min-w-40 h-8">
              <SelectValue
                placeholder={String(
                  t('datasets.modification.valueTypePlaceholder', 'Тип значения')
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reference">
                {String(t('datasets.modification.reference', 'ссылка'))}
              </SelectItem>
              <SelectItem value="literal">
                {String(t('datasets.modification.literal', 'литерал'))}
              </SelectItem>
              <SelectItem value="template">
                {String(t('datasets.modification.template', 'шаблон'))}
              </SelectItem>
              <SelectItem value="expression">
                {String(t('datasets.modification.expression', 'выражение'))}
              </SelectItem>
              <SelectItem
                value="function"
                disabled
                title={String(t('datasets.modification.soon', 'Скоро'))}
              >
                {String(t('datasets.modification.function', 'функция (скоро)'))}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={String(t('datasets.modification.deleteTitle', 'Удалить'))}
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
              <SelectTrigger
                className="min-w-40 h-8"
                title={String(t('datasets.modification.columnNameTitle', 'column name'))}
              >
                <SelectValue
                  placeholder={String(
                    t('datasets.modification.columnNamePlaceholder', 'column name')
                  )}
                />
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
              placeholder={String(t('datasets.modification.columnNamePlaceholder', 'column name'))}
              value={(value as ColumnReference).value as string}
              onChange={(e) => setReferenceValue(e.target.value)}
              className="h-8"
            />
          ))}

        {type === 'literal' && (
          <Input
            placeholder={String(
              t('datasets.modification.literalPlaceholder', 'string | number | boolean')
            )}
            value={String((value as ColumnLiteral).value ?? '')}
            onChange={(e) => setLiteralValue(e.target.value)}
            className="h-8"
          />
        )}

        {type === 'template' && (
          <TemplateEditor
            value={(value as ColumnTemplate).value as string}
            columns={columns || []}
            onChange={(val) => setTemplateValue(val)}
          />
        )}

        {type === 'expression' && (
          <ExpressionEditor
            value={(value as ColumnExpression).value as string}
            columns={columns || []}
            params={params || []}
            onChange={(val) => setExpressionValue(val)}
          />
        )}

        {type === 'function' && (
          <div className="flex flex-col gap-2 w-full">
            <div className="text-sm text-muted-foreground">
              {String(
                t('datasets.modification.functionsSoon', 'Поддержка функций появится скоро.')
              )}
            </div>
          </div>
        )}
      </ItemContent>
    </Item>
  )
}

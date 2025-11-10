import { useEffect, useState } from 'react'
import { Field, FieldContent, FieldLabel } from '~/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import type { SaveMapping } from '#interfaces/save_mapping'
import { DataSourceSelect } from '../datasource/data-source-select'
import { usePage } from '@inertiajs/react'
import { TableSelect } from './table-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { X, Loader2 } from 'lucide-react'
import _ from 'lodash'

export type MappingEditorProps = {
  resultColumns?: string[]
  children?: React.ReactNode
  config?: SaveMapping
  onSave?: (mapping: SaveMapping) => void
  saveBtnName?: string
}

export function MappingEditor({
  config,
  children,
  resultColumns,
  onSave,
  saveBtnName = 'Добавить',
}: MappingEditorProps) {
  const { csrfToken } = usePage().props as any
  const [sourceId, setSourceId] = useState<number>(config?.sourceId || 0)
  const [loading, setLoading] = useState(false)
  const [table, setTable] = useState<string>('')
  const [columns, setColumns] = useState<string[]>([])
  const [savedMappingState, setSavedMappingState] = useState<Record<string, string>[]>(
    () => config?.savedMapping ?? []
  )
  const [updateOnState, setUpdateOnState] = useState(config?.updateOn ?? [])

  // UI state for adding UpdateOn items
  const [updateOpen, setUpdateOpen] = useState(false)
  const [newUpdateTableColumn, setNewUpdateTableColumn] = useState('')
  const [newUpdateAliasColumn, setNewUpdateAliasColumn] = useState('')
  const [newUpdateOperator, setNewUpdateOperator] = useState<'=' | '!=' | '<' | '<=' | '>' | '>='>(
    '='
  )
  const [newUpdateCond, setNewUpdateCond] = useState<'and' | 'or' | undefined>('and')

  const [open, setOpen] = useState(false)
  const [tables, setTables] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [newTableColumn, setNewTableColumn] = useState('')
  const [newResultColumn, setNewResultColumn] = useState('')

  const resetForm = () => {
    setSourceId(config?.sourceId || 0)
    setSavedMappingState(config?.savedMapping ?? [])
    setUpdateOnState(config?.updateOn ?? [])
  }

  const onSelectSourceId = async (value: number) => {
    if (!value) {
      setTables([])
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/sql/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: JSON.stringify({ dataSourceId: value /*, schema: 'public' для Postgres */ }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setTables(Array.isArray(data?.tables) ? data.tables : [])
    } catch (e) {
      console.error('Не удалось загрузить таблицы', e)
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  const fetchColumnsTable = async (table: string) => {
    if (!table) return
    try {
      setLoading(true)
      const res = await fetch('/sql/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: JSON.stringify({ dataSourceId: sourceId, table }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const columns = _.first(Object.values(data?.columns))
      setColumns(_.isArray(columns) ? columns : [])
    } catch (e) {
      console.error('Не удалось загрузить столбцы', e)
      setColumns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    onSelectSourceId(sourceId)
  }, [sourceId])

  useEffect(() => {
    if (table) fetchColumnsTable(table)
  }, [sourceId, table])

  useEffect(() => {
    if (config) {
      setSavedMappingState(config.savedMapping ?? [])
      setUpdateOnState(config.updateOn ?? [])
      setSourceId(config.sourceId || 0)
    }
  }, [config])

  const handleSave = () => {
    if (!sourceId) return
    const payload: SaveMapping = {
      id: config?.id ?? Date.now().toString(36),
      sourceId,
      savedMapping: savedMappingState,
      updateOn: updateOnState,
    }
    if (typeof onSave === 'function') onSave(payload)
    setOpen(false)
    resetForm()
  }

  const handleCancel = () => {
    resetForm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Создание соответствия</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1" aria-busy={loading}>
          <div className="flex gap-3">
            <div className="flex-1">
              <DataSourceSelect value={sourceId} onChange={setSourceId} />
            </div>

            <div className="flex-1">
              <Field>
                <FieldLabel>Таблица</FieldLabel>
                <FieldContent className="w-full">
                  <TableSelect tables={tables} selectedTable={table} onSelectTable={setTable} />
                </FieldContent>
              </Field>
            </div>
          </div>

          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2">
                Соответствия колонок
                {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              <Button variant="outline" onClick={() => setAddOpen(true)} disabled={loading}>
                Добавить соответствие
              </Button>
            </div>

            {savedMappingState.length === 0 && (
              <div className="text-sm text-muted-foreground">Пока нет добавленных соответствий</div>
            )}

            {savedMappingState.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {savedMappingState.map((item, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    title={`${(item as any).tableColumn || ''} → ${(item as any).resultColumn || ''}`}
                  >
                    <span>{(item as any).tableColumn || ''}</span>
                    <span>→</span>
                    <span>{(item as any).resultColumn || ''}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSavedMappingState((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      aria-label="Удалить соответствие"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2">
                Условия обновления
                {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              <Button variant="outline" onClick={() => setUpdateOpen(true)} disabled={loading}>
                Добавить условие
              </Button>
            </div>

            {updateOnState.length === 0 && (
              <div className="text-sm text-muted-foreground">Пока нет добавленных условий</div>
            )}

            {updateOnState.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {updateOnState.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    title={`${item.tableColumn || ''} ${item.operator || ''} ${item.aliasColumn || ''}${item.cond ? ` (${item.cond})` : ''}`}
                  >
                    <span>{item.tableColumn || ''}</span>
                    <span>{item.operator || ''}</span>
                    <span>{item.aliasColumn || ''}</span>
                    {idx > 0 && item.cond && (
                      <span className="ml-1 text-muted-foreground">({item.cond})</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setUpdateOnState((prev) => prev.filter((_, i) => i !== idx))}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      aria-label="Удалить условие"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleSave}>
              {saveBtnName}
            </Button>
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Отмена
            </Button>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка данных...
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить соответствие</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field>
              <FieldLabel>Колонка таблицы</FieldLabel>
              <Select value={newTableColumn} onValueChange={setNewTableColumn}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Выберите колонку" />
                </SelectTrigger>
                <SelectContent>
                  {columns.filter(
                    (c) => !savedMappingState.some((m) => (m as any).tableColumn === c)
                  ).length > 0 ? (
                    columns
                      .filter((c) => !savedMappingState.some((m) => (m as any).tableColumn === c))
                      .map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="__no_cols__" disabled>
                      Нет колонок
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Колонка результата</FieldLabel>
              <Select value={newResultColumn} onValueChange={setNewResultColumn}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Выберите колонку" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(resultColumns) &&
                  resultColumns.filter(
                    (c) => !savedMappingState.some((m) => (m as any).resultColumn === c)
                  ).length > 0 ? (
                    resultColumns
                      .filter((c) => !savedMappingState.some((m) => (m as any).resultColumn === c))
                      .map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="__no_cols__" disabled>
                      Нет колонок
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (!newTableColumn || !newResultColumn) return
                  const entry: Record<string, string> = {
                    tableColumn: newTableColumn,
                    resultColumn: newResultColumn,
                  }
                  setSavedMappingState((prev) => [...prev, entry])
                  setNewTableColumn('')
                  setNewResultColumn('')
                  setAddOpen(false)
                }}
                disabled={!newTableColumn || !newResultColumn}
              >
                Добавить
              </Button>
              <Button variant="ghost" onClick={() => setAddOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить условие обновления</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field>
              <FieldLabel>Колонка таблицы</FieldLabel>
              <Select value={newUpdateTableColumn} onValueChange={setNewUpdateTableColumn}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Выберите колонку" />
                </SelectTrigger>
                <SelectContent>
                  {columns.length > 0 ? (
                    columns.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_cols__" disabled>
                      Нет колонок
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Alias колонка</FieldLabel>
              <Select value={newUpdateAliasColumn} onValueChange={setNewUpdateAliasColumn}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Выберите колонку" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(resultColumns) && resultColumns.length > 0 ? (
                    resultColumns.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_cols__" disabled>
                      Нет колонок
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex gap-3">
              <div className="flex-1">
                <Field>
                  <FieldLabel>Оператор</FieldLabel>
                  <Select
                    value={newUpdateOperator}
                    onValueChange={(v) => setNewUpdateOperator(v as any)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Выберите оператор" />
                    </SelectTrigger>
                    <SelectContent>
                      {['=', '!=', '<', '<=', '>', '>='].map((op) => (
                        <SelectItem key={op} value={op}>
                          {op}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {updateOnState.length > 0 && (
                <div className="flex-1">
                  <Field>
                    <FieldLabel>Условие (cond)</FieldLabel>
                    <Select
                      value={newUpdateCond ?? ''}
                      onValueChange={(v) => setNewUpdateCond((v as any) || undefined)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="and / or" />
                      </SelectTrigger>
                      <SelectContent>
                        {['and', 'or'].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (!newUpdateTableColumn || !newUpdateAliasColumn || !newUpdateOperator) return
                  const entry = {
                    tableColumn: newUpdateTableColumn,
                    aliasColumn: newUpdateAliasColumn,
                    operator: newUpdateOperator,
                    cond: updateOnState.length > 0 ? newUpdateCond : undefined,
                  }
                  setUpdateOnState((prev) => [...prev, entry])
                  setNewUpdateTableColumn('')
                  setNewUpdateAliasColumn('')
                  setNewUpdateOperator('=')
                  setNewUpdateCond('and')
                  setUpdateOpen(false)
                }}
                disabled={!newUpdateTableColumn || !newUpdateAliasColumn || !newUpdateOperator}
              >
                Добавить
              </Button>
              <Button variant="ghost" onClick={() => setUpdateOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

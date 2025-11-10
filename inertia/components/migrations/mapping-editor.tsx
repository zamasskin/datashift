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
import { X } from 'lucide-react'
import _ from 'lodash'

export type MappingEditorProps = {
  resultColumns?: string[]
  children?: React.ReactNode
  config?: SaveMapping
  onSave?: (mapping: SaveMapping) => void
}

export function MappingEditor({ config, children, resultColumns, onSave }: MappingEditorProps) {
  const { csrfToken } = usePage().props as any
  const [sourceId, setSourceId] = useState<number>(config?.sourceId || 0)
  const [loading, setLoading] = useState(false)
  const [table, setTable] = useState<string>('')
  const [columns, setColumns] = useState<string[]>([])
  const [savedMappingState, setSavedMappingState] = useState<Record<string, string>[]>(
    () => config?.savedMapping ?? []
  )
  const [updateOnState, setUpdateOnState] = useState(config?.updateOn ?? [])

  const [open, setOpen] = useState(false)
  const [tables, setTables] = useState<string[]>([])
  const [source, setSource] = useState<string>('')
  const [addOpen, setAddOpen] = useState(false)
  const [newTableColumn, setNewTableColumn] = useState('')
  const [newResultColumn, setNewResultColumn] = useState('')

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
  }

  const handleCancel = () => {
    // TODO: Продумать как сбрасывать состояние формы
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Создание соответствия</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
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
              <div className="font-medium">Соответствия колонок</div>
              <Button variant="outline" onClick={() => setAddOpen(true)}>
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
                      onClick={() => setSavedMappingState((prev) => prev.filter((_, i) => i !== idx))}
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

          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleSave}>
              Сохранить соответствие
            </Button>
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Отмена
            </Button>
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
              <FieldLabel>Колонка результата</FieldLabel>
              <Select value={newResultColumn} onValueChange={setNewResultColumn}>
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
    </Dialog>
  )
}

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

export type MappingEditorProps = {
  resultColumns?: string[]
  children?: React.ReactNode
  config?: SaveMapping
  onSave?: (mapping: SaveMapping) => void
}

export function MappingEditor({ config, children, resultColumns }: MappingEditorProps) {
  const { csrfToken } = usePage().props as any
  const [sourceId, setSourceId] = useState<number>(config?.sourceId || 0)
  const [loading, setLoading] = useState(false)
  const [table, setTable] = useState<string>('')
  const [columns, setColumns] = useState<string[]>([])

  const [open, setOpen] = useState(false)
  const [tables, setTables] = useState<string[]>([])
  const [source, setSource] = useState<string>('')

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
        body: JSON.stringify({ table }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setColumns(Array.isArray(data?.columns) ? data.columns : [])
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

  const handleSave = () => {
    // const id = Number(datasetIdInput)
    // if (!Number.isFinite(id) || id <= 0 || !source) return
    // const payload: SaveMapping = {
    //   id: Date.now().toString(36),
    //   sourceId: id,
    //   savedMapping: [],
    //   updateOn: [],
    // }
    // onSave?.(payload)
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
    </Dialog>
  )
}

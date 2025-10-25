import { useEffect, useMemo, useState } from 'react'
import { DataSourceSelect } from '~/components/datasource/data-source-select'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { SqlEditor } from '../sql-editor'
import { Spinner } from '~/components/ui/spinner'
import { usePage } from '@inertiajs/react'
import DataSource from '#models/data_source'

export type Config = {
  type: 'sql'
  id: string
  params: {
    sourceId: number
    query: string
  }
}

export type SqlEditorProps = {
  isLoading?: boolean
  paramKeys?: string[]
  config?: Config
  prevResults?: Record<string, string[]>
  children?: React.ReactNode
  saveBtnName?: string
  onSave?: (config: Config) => void
}

export function SqlDataset(props: SqlEditorProps) {
  const { csrfToken, dataSources } = usePage().props as any
  const [sourceId, setSourceId] = useState(0)
  const [query, setQuery] = useState(props?.config?.params?.query || '')
  const [isLoading, setIsLoading] = useState(false)
  const [tables, setTables] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  const isShowLoading = useMemo(() => props.isLoading || isLoading, [props.isLoading, isLoading])

  const onSelectSourceId = async (value: number) => {
    setSourceId(value)
    // TODO: Подгрузить таблицы из источника данных
    if (!value) {
      setTables([])
      return
    }
    try {
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  useEffect(() => {
    onSelectSourceId(sourceId)
  }, [sourceId])

  useEffect(() => {
    setQuery(props?.config?.params?.query || '')
  }, [props?.config?.params?.query])

  useEffect(() => {
    setSourceId(getDefaultSourceId(dataSources, props?.config?.params?.sourceId))
  }, [props?.config?.params?.sourceId])

  const handleSave = async () => {
    if (props.onSave) {
      if (props?.config) {
        console.log('update config', { ...props?.config, params: { query, sourceId } })
        props.onSave({ ...props?.config, params: { query, sourceId } })
      } else {
        setQuery('')
        props.onSave({ type: 'sql', id: Date.now().toString(36), params: { query, sourceId } })
      }
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="max-w-[92vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[75vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>Sql запрос</DialogTitle>
          <DialogDescription>
            <DataSourceSelect value={sourceId} onChange={setSourceId} />
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <SqlEditor
            value={query}
            onChange={setQuery}
            tables={tables}
            paramKeys={props.paramKeys}
            prevResults={props.prevResults}
          />

          {isShowLoading && (
            <div className="absolute bottom-4 right-2">
              <Spinner className="text-muted-foreground" />
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Закрыть</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSave}>
            {props.saveBtnName || 'Добавить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getDefaultSourceId(dataSources: DataSource[], selectSourceId?: number) {
  const sourcesId: number[] = dataSources.map((source: DataSource) => source.id)
  if (selectSourceId && sourcesId.includes(selectSourceId)) {
    return selectSourceId
  }

  return sourcesId[0] || 0
}

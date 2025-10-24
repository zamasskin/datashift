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

export type SqlEditorProps = {
  isLoading?: boolean
}

export function SqlDataset(props: SqlEditorProps) {
  const { csrfToken, dataSources } = usePage().props as any
  const [sourceId, setSourceId] = useState(dataSources[0]?.id || 0)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tables, setTables] = useState<string[]>([])

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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Добавить</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[92vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[75vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>Sql запрос</DialogTitle>
          <DialogDescription>
            <DataSourceSelect value={sourceId} onChange={setSourceId} />
          </DialogDescription>

          <div className="relative">
            <SqlEditor
              value={query}
              onChange={setQuery}
              tables={tables}
              paramKeys={['userId', 'date', 'region']}
              prevResults={{ sql1: ['ID', 'TOTAL', 'USER_ID'] }}
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
            <Button type="submit">Добавить</Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

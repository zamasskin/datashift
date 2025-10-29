import DataSource from '#models/data_source'
import { usePage } from '@inertiajs/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { WhereData, WhereEditor } from './sql-builder-dataset/where-editor'
import { TableSelect } from '../table-select'
import { Field, FieldContent, FieldLabel } from '~/components/ui/field'
import { Spinner } from '~/components/ui/spinner'
import { Input } from '~/components/ui/input'

export type SqlBuilderConfig = {
  type: 'sql_builder'
  id: string
  params: {
    sourceId: number
    table: string
    selects?: string[]
    orders?: Record<string, 'asc' | 'desc'>[]
    joins?: any
    where?: WhereData
    hawing?: WhereData
    group?: string[]
  }
}

export type SqlBuilderProps = {
  children?: React.ReactNode
  saveBtnName?: string
  config?: SqlBuilderConfig
  suggestions?: string[]
  isLoading?: boolean
  onSave?: (config: SqlBuilderConfig) => void
}

export function SqlBuilderDataset(props: SqlBuilderProps) {
  const [loading, setLoading] = useState(false)
  const { csrfToken, dataSources } = usePage().props as any
  const [open, setOpen] = useState(false)
  const [sourceId, setSourceId] = useState(0)
  const [table, setTable] = useState('')
  const [where, setWhere] = useState<WhereData>({})
  const [hawing, setHawing] = useState<WhereData>({})

  const [tables, setTables] = useState([])
  const [suggestionKeys, setSuggestionKeys] = useState([])

  const isLoading = useMemo(() => loading || props.isLoading, [loading, props.isLoading])

  const onSelectSourceId = async (value: number) => {
    setSourceId(value)
    // TODO: Подгрузить таблицы из источника данных
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

  useEffect(() => {
    onSelectSourceId(sourceId)
  }, [sourceId])

  useEffect(() => {
    setSuggestionKeys([])
    // TODO Тут получать колонки всех выбранных таблиц
  }, [props?.config?.params?.table, props?.config?.params?.joins])

  useEffect(() => {
    setSourceId(getDefaultSourceId(dataSources, props?.config?.params?.sourceId))
  }, [props?.config?.params?.sourceId])

  // GroupBlock nested UI component for $and/$or

  const handleSave = async () => {
    if (props.onSave) {
      if (props?.config) {
        props.onSave({ ...props?.config, params: { sourceId, table, where } })
      } else {
        props.onSave({
          type: 'sql_builder',
          id: Date.now().toString(36),
          params: { sourceId, table, where },
        })
      }
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[85vh] overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>Редактор запроса</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <DataSourceSelect value={sourceId} onChange={setSourceId} />
        <div className="grid md:grid-cols-2 gap-2">
          <Field>
            <FieldLabel>Таблица</FieldLabel>
            <FieldContent className="w-full">
              <TableSelect tables={tables} selectedTable={table} onSelectTable={setTable} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Алиас</FieldLabel>
            <Input />
          </Field>
        </div>

        <div className="mt-4 max-h-[68vh] overflow-y-auto pr-1">
          <Tabs defaultValue="selects">
            <TabsList>
              <TabsTrigger value="selects">select</TabsTrigger>
              <TabsTrigger value="order">order</TabsTrigger>
              <TabsTrigger value="joins">joins</TabsTrigger>
              <TabsTrigger value="where">where</TabsTrigger>
              <TabsTrigger value="group">group</TabsTrigger>
              <TabsTrigger value="hawing">hawing</TabsTrigger>
            </TabsList>
            <TabsContent value="selects">
              <Card>
                <CardHeader>
                  <CardTitle>Select</CardTitle>
                  <CardDescription>Настройка выборки</CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="order">
              <Card>
                <CardHeader>
                  <CardTitle>Ордер</CardTitle>
                  <CardDescription>Настройка сортировки</CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="joins">
              <Card>
                <CardHeader>
                  <CardTitle>Joins</CardTitle>
                  <CardDescription>Настройка связанных таблиц</CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="where">
              <Card>
                <CardHeader>
                  <CardTitle>Where</CardTitle>
                  <CardDescription>Настройка фильтров</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-72 max-w-full overflow-scroll">
                    <WhereEditor
                      suggestionKeys={suggestionKeys}
                      suggestionValues={['hello', 'world']}
                      data={where}
                      onChange={setWhere}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="group">
              <Card>
                <CardHeader>
                  <CardTitle>Group</CardTitle>
                  <CardDescription>Настройка группировки</CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="hawing">
              <Card>
                <CardHeader>
                  <CardTitle>Hawing</CardTitle>
                  <CardDescription>Настройка условий группировок</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-72 max-w-full overflow-scroll">
                    <WhereEditor
                      suggestionKeys={suggestionKeys}
                      suggestionValues={['hello', 'world']}
                      data={hawing}
                      onChange={setHawing}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="items-center">
          {isLoading && <Spinner />}
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

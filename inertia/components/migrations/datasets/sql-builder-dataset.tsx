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
import { JoinEditor, JoinItem } from './sql-builder-dataset/join-editor'
import { ScrollArea } from '~/components/ui/scroll-area'
import { SelectsEditor } from '~/components/migrations/datasets/sql-builder-dataset/selects-editor'
import { OrdersEditor } from '~/components/migrations/datasets/sql-builder-dataset/order-editor'
import { GroupEditor } from '~/components/migrations/datasets/sql-builder-dataset/group-editor'

export type SqlBuilderConfig = {
  type: 'sql_builder'
  id: string
  params: {
    sourceId: number
    table: string
    alias?: string
    selects?: string[]
    orders?: Record<string, 'asc' | 'desc'>[]
    joins?: JoinItem[]
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
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export function SqlBuilderDataset({ config, ...props }: SqlBuilderProps) {
  const [loading, setLoading] = useState(false)
  const { csrfToken, dataSources } = usePage().props as any
  const [open, setOpen] = useState(false)
  const [sourceId, setSourceId] = useState(config?.params?.sourceId || 0)
  const [table, setTable] = useState(config?.params?.table || '')
  const [alias, setAlias] = useState(config?.params?.alias || '')
  const [where, setWhere] = useState<WhereData>(config?.params?.where || {})
  const [hawing, setHawing] = useState<WhereData>(config?.params?.hawing || {})
  const [joins, setJoins] = useState<JoinItem[]>(config?.params?.joins || [])
  const [selects, setSelects] = useState<string[]>(config?.params?.selects || [])
  const [orders, setOrders] = useState<Record<string, 'asc' | 'desc'>[]>([])
  const [group, setGroup] = useState<string[]>([])

  const [tables, setTables] = useState<string[]>([])
  const [suggestionKeys, setSuggestionKeys] = useState<string[]>([])
  const [columnsMap, setColumnsMap] = useState<Record<string, string[]>>({})

  const isLoading = useMemo(() => loading || props.isLoading, [loading, props.isLoading])

  const onSelectSourceId = async (value: number) => {
    setSourceId(value)
    // Сбросим кэш колонок и подсказок при смене источника
    setColumnsMap({})
    setSuggestionKeys([])
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

  // Загрузка колонок для указанного набора таблиц
  const fetchColumnsForTables = async (tablesToFetch: string[]) => {
    const unique = Array.from(new Set((tablesToFetch || []).filter(Boolean)))
    if (!sourceId || unique.length === 0) return
    try {
      setLoading(true)
      const res = await fetch('/sql/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: JSON.stringify({ dataSourceId: sourceId, table: unique /*, schema: 'public' */ }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const incoming: Record<string, string[]> = data?.columns || {}
      if (incoming && typeof incoming === 'object') {
        setColumnsMap((prev) => ({ ...prev, ...incoming }))
      }
    } catch (e) {
      console.error('Не удалось загрузить колонки', e)
    } finally {
      setLoading(false)
    }
  }

  // При выборе основной таблицы — подгружаем её колонки
  useEffect(() => {
    if (!table) return
    if (!columnsMap[table]) {
      fetchColumnsForTables([table])
    }
  }, [table, sourceId])

  // При изменении joins — подгружаем колонки всех упомянутых таблиц
  useEffect(() => {
    const joinTables = (joins || []).map((j) => j.table).filter(Boolean)
    const needFetch = joinTables.filter((t) => !columnsMap[t])
    if (needFetch.length > 0) {
      fetchColumnsForTables(needFetch)
    }
  }, [joins, sourceId])

  // Формируем подсказки ключей для WhereEditor из загруженных колонок
  useEffect(() => {
    const keys: string[] = []
    const basePrefix = alias || table
    if (basePrefix && columnsMap[table]?.length) {
      keys.push(...columnsMap[table].map((c) => `${basePrefix}.${c}`))
    }
    for (const j of joins || []) {
      const joinPrefix = j.alias || j.table
      if (joinPrefix && columnsMap[j.table]?.length) {
        keys.push(...columnsMap[j.table].map((c) => `${joinPrefix}.${c}`))
      }
    }
    setSuggestionKeys(keys)
  }, [columnsMap, table, alias, joins])

  useEffect(() => {
    setSourceId(getDefaultSourceId(dataSources, config?.params?.sourceId))
  }, [config?.params?.sourceId])

  // GroupBlock nested UI component for $and/$or

  const handleSave = async () => {
    if (props.onSave) {
      if (config) {
        props.onSave({
          ...config,
          params: { sourceId, table, alias, selects, orders, joins, where, hawing, group },
        })
      } else {
        props.onSave({
          type: 'sql_builder',
          id: Date.now().toString(36),
          params: { sourceId, table, alias, selects, orders, joins, where, hawing, group },
        })
      }
    }

    if (props?.onOpenChange) props.onOpenChange(false)
    setOpen(false)
  }

  return (
    <Dialog open={props.open || open} onOpenChange={props.onOpenChange || setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[85vh] overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>Редактор запроса</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <DataSourceSelect value={sourceId} onChange={setSourceId} />
        {tables.length > 0 && (
          <div className="grid md:grid-cols-2 gap-2">
            <Field>
              <FieldLabel>Таблица</FieldLabel>
              <FieldContent className="w-full">
                <TableSelect tables={tables} selectedTable={table} onSelectTable={setTable} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Алиас</FieldLabel>
              <Input value={alias} onChange={(ev) => setAlias(ev.target.value)} />
            </Field>
          </div>
        )}

        {tables.length == 0 && <div>Для выбранных источников данных таблицы не найдены.</div>}

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
                <CardContent>
                  <SelectsEditor
                    suggestions={suggestionKeys}
                    value={selects}
                    onChange={setSelects}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="order">
              <Card>
                <CardHeader>
                  <CardTitle>Ордер</CardTitle>
                  <CardDescription>Настройка сортировки</CardDescription>
                </CardHeader>
                <CardContent>
                  <OrdersEditor suggestions={suggestionKeys} value={orders} onChange={setOrders} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="joins">
              <Card>
                <CardHeader>
                  <CardTitle>Joins</CardTitle>
                  <CardDescription>Настройка связанных таблиц</CardDescription>
                </CardHeader>
                <CardContent>
                  <JoinEditor
                    tables={tables}
                    data={joins}
                    onChange={setJoins}
                    columnsMap={columnsMap}
                    baseTable={table}
                    baseAlias={alias}
                  />
                </CardContent>
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
                    <ScrollArea>
                      <WhereEditor
                        suggestionKeys={suggestionKeys}
                        suggestionValues={['hello', 'world']}
                        data={where}
                        onChange={setWhere}
                      />
                    </ScrollArea>
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
                <CardContent>
                  <GroupEditor suggestions={suggestionKeys} value={group} onChange={setGroup} />
                </CardContent>
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

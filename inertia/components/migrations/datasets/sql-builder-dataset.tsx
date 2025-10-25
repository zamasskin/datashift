import DataSource from '#models/data_source'
import { usePage } from '@inertiajs/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useEffect, useState } from 'react'
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

type WhereRawValue = string | number | Date
type WhereValue = WhereRawValue | { $in: WhereRawValue[] } | { $nin: WhereRawValue[] }
type Where = {
  key?: string
  value?: WhereValue
  cond?: 'and' | 'or'
  $and?: Where[]
  $or?: Where[]
}

export type SqlBuilderConfig = {
  type: 'sql_builder'
  id: string
  params: {
    sourceId: number
    table: string
    selects?: string[]
    orders?: Record<string, 'asc' | 'desc'>[]
    where?: Where[]
    hawing?: Where[]
    group?: string[]
  }
}

export type SqlBuilderProps = {
  children?: React.ReactNode
  saveBtnName?: string
  config?: SqlBuilderConfig

  onSave?: (config: SqlBuilderConfig) => void
}

export function SqlBuilderDataset(props: SqlBuilderProps) {
  const { csrfToken, dataSources } = usePage().props as any
  const [open, setOpen] = useState(false)
  const [sourceId, setSourceId] = useState(0)
  const [table, setTable] = useState('')

  useEffect(() => {
    setSourceId(getDefaultSourceId(dataSources, props?.config?.params?.sourceId))
  }, [props?.config?.params?.sourceId])

  const handleSave = async () => {
    if (props.onSave) {
      if (props?.config) {
        props.onSave({ ...props?.config, params: { sourceId, table } })
      } else {
        props.onSave({
          type: 'sql_builder',
          id: Date.now().toString(36),
          params: { sourceId, table },
        })
      }
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="max-w-[92vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[75vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>Редактор запроса</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <DataSourceSelect value={sourceId} onChange={setSourceId} />

        <div>
          <Tabs defaultValue="selects" className="mt-8">
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
                <CardContent></CardContent>
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
                  <CardDescription>Настройка условий группировки</CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

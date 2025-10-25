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
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'
import { Field, FieldLabel } from '~/components/ui/field'
import { Badge } from '~/components/ui/badge'

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
  const [where, setWhere] = useState<Where[]>(props?.config?.params?.where || [])

  useEffect(() => {
    setSourceId(getDefaultSourceId(dataSources, props?.config?.params?.sourceId))
  }, [props?.config?.params?.sourceId])

  // GroupBlock nested UI component for $and/$or
  function GroupBlock({ items, type, onChange }: { items: Where[]; type: 'and' | 'or'; onChange: (items: Where[]) => void }) {
    const addLeaf = () => onChange([...(items || []), { key: '', value: '' }])
    const addGroup = (t: 'and' | 'or') => onChange([...(items || []), t === 'and' ? { $and: [] } : { $or: [] }])
    const removeItem = (index: number) => onChange((items || []).filter((_, i) => i !== index))
    const updateItem = (index: number, next: Where) => onChange((items || []).map((it, i) => (i === index ? next : it)))
  
    const getType = (item: Where): 'and' | 'or' | null => (item.$and ? 'and' : item.$or ? 'or' : null)
    const getChildren = (item: Where): Where[] => (item.$and ? item.$and : item.$or ? item.$or : [])
    const setChildren = (item: Where, t: 'and' | 'or', children: Where[]): Where => (t === 'and' ? { $and: children } : { $or: children })
  
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Группа: {type.toUpperCase()}</Badge>
          <Button size="sm" variant="outline" onClick={addLeaf}>Добавить условие</Button>
          <Button size="sm" variant="outline" onClick={() => addGroup('and')}>Добавить группу AND</Button>
          <Button size="sm" variant="outline" onClick={() => addGroup('or')}>Добавить группу OR</Button>
        </div>
  
        <div className="space-y-3">
          {(items || []).map((item, idx) => {
            const t = getType(item)
            if (t) {
              const children = getChildren(item)
              return (
                <div key={idx} className="rounded-md border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Подгруппа: {t.toUpperCase()}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => updateItem(idx, setChildren(item, t === 'and' ? 'or' : 'and', children))}>
                      Поменять на {t === 'and' ? 'OR' : 'AND'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => removeItem(idx)}>Удалить группу</Button>
                  </div>
                  <GroupBlock
                    items={children}
                    type={t}
                    onChange={(newChildren) => updateItem(idx, setChildren(item, t, newChildren))}
                  />
                </div>
              )
            }
  
            return (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <Field>
                  <FieldLabel>Поле</FieldLabel>
                  <Input
                    placeholder="например: users.status"
                    value={item.key ?? ''}
                    onChange={(e) => updateItem(idx, { ...item, key: e.target.value })}
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel>Значение</FieldLabel>
                  <Input
                    placeholder="значение"
                    value={typeof item.value === 'string' || typeof item.value === 'number' ? String(item.value ?? '') : ''}
                    onChange={(e) => updateItem(idx, { ...item, value: e.target.value })}
                  />
                </Field>
                <Button size="sm" variant="destructive" onClick={() => removeItem(idx)}>Удалить</Button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

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
                <CardContent>
                  <GroupBlock items={where} type="and" onChange={setWhere} />
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

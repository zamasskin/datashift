import Migration from '#models/migration'
import { Head, router, usePage } from '@inertiajs/react'
import { ArrowDownUp, FileWarning, Pencil, Save, Settings, Trash } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SqlCard } from '~/components/migrations/cards/sql-card'
import { SqlBuilderDataset } from '~/components/migrations/datasets/sql-builder-dataset'
import { SqlDataset } from '~/components/migrations/datasets/sql-dataset'
import { RootLayout } from '~/components/root-layout'
import { Alert, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import {
  ItemGroup,
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from '~/components/ui/item'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { Switch } from '~/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

const fcSettings: Record<string, { name: string; icon: string }> = {
  sql: { name: 'SQL Запрос', icon: '/icons/sql-edit.png' },
  sqlBuilder: { name: 'Редактор запроса', icon: '/icons/sql-build.png"' },
  merge: { name: 'Объединение', icon: '/icons/merge.png' },
  modification: { name: 'Модификация', icon: '/icons/modify.png' },
}

const MigrationEdit = ({ migration }: { migration: Migration }) => {
  const { props } = usePage<{ csrfToken?: string }>()
  const [name, setName] = useState(migration.name)
  const [cronExpression, setCronExpression] = useState(migration.cronExpression || '')
  const [fetchConfigs, setFetchConfigs] = useState(migration.fetchConfigs || [])
  const [saveMappings, setSaveMappings] = useState(migration.saveMappings || [])
  const [params, setParams] = useState(migration.params || [])
  const [isActive, setIsActive] = useState(migration.isActive || false)
  const [addType, setAddType] = useState('sql')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [prevResults, setPrevResults] = useState<Record<string, string[]>>({})

  const [saveLoading, setSaveLoading] = useState(false)
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})

  const paramKeys = useMemo(() => params.map((p) => p.key as string), [params])

  const onSave = () => {
    setSaveLoading(true)
    setSaveErrors({})
    console.log(fetchConfigs)
    router.put(
      `/migrations/${migration.id}`,
      { name, cronExpression, isActive, fetchConfigs, saveMappings, params },
      {
        preserveScroll: true,
        headers: props.csrfToken ? { 'X-CSRF-TOKEN': props.csrfToken } : undefined,
        onError: (errors: any) => {
          const map: Record<string, string> = {}
          Object.entries(errors || {}).forEach(([field, message]) => {
            map[field] = Array.isArray(message) ? String(message[0]) : String(message as any)
          })
          setSaveErrors(map)
          setSaveLoading(false)
        },
        onSuccess: () => {
          setSaveLoading(false)
        },
      }
    )
  }

  const handleRemove = (id: string) => {
    setFetchConfigs((old) => old.filter((cfg) => cfg.id !== id))
  }

  const handleSave = (config: { id: string }) => {
    setFetchConfigs((old) => old.map((item) => (item.id == config.id ? config : item)))
  }

  return (
    <>
      <Head title="Миграции" />
      <div className="px-4 lg:px-6 space-y-4">
        <div className="space-y-2">
          <div className="grid w-full max-w-sm items-center gap-3">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-[320px]"
            />
            {saveErrors?.name && <p className="text-sm text-destructive">{saveErrors.name}</p>}
          </div>
        </div>

        <Tabs defaultValue="config" className="mt-8">
          <div className="flex gap-4 items-center">
            <TabsList>
              <TabsTrigger value="config">
                <Settings />
                Настройки
              </TabsTrigger>
              <TabsTrigger value="migrations">
                <ArrowDownUp />
                Миграции
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="airplane-mode">Активно</Label>
            </div>
          </div>

          <TabsContent value="config" className="mt-4 max-w-xl">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Параметры</CardTitle>
                  <CardDescription>
                    Добавьте настройки, которые будут использоваться в миграции.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Настройка прараметров</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Расписание</CardTitle>
                  <CardDescription>
                    Укажите расписание выполнения миграции в формате cron-выражения.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid w-full max-w-sm items-center gap-3">
                    <Label htmlFor="cronExpression">Cron выражение</Label>
                    <Input
                      id="cronExpression"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      className="w-[320px]"
                    />
                    {saveErrors?.cronExpression && (
                      <p className="text-sm text-destructive">{saveErrors.cronExpression}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="migrations" className="mt-4 max-w-xl">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Датасеты</CardTitle>
                  <CardDescription>
                    Добавьте датасеты, которые будут использоваться в миграции.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex w-full max-w-xl flex-col gap-4">
                    <ItemGroup className="gap-2">
                      {fetchConfigs.map((conf) => (
                        <div key={conf?.id}>
                          {conf?.type == 'sql' && (
                            <SqlCard
                              paramKeys={paramKeys}
                              isLoading={isLoading}
                              prevResults={undefined}
                              config={conf}
                              onRemove={handleRemove}
                              onUpdate={handleSave}
                            />
                          )}
                        </div>
                      ))}
                      <MyItem name="sql1" icon="/icons/sql-edit.png" />
                      <MyItem name="sql2" icon="/icons/sql-build.png" />
                      <MyItem name="sql3" icon="/icons/merge.png" />
                      <MyItem name="sql3" icon="/icons/modify.png" />
                    </ItemGroup>

                    <div className="flex gap-2">
                      <SqlDataset
                        onSave={(config) => setFetchConfigs([...fetchConfigs, config])}
                        prevResults={prevResults}
                        paramKeys={paramKeys}
                        isLoading={isLoading}
                      >
                        <Button>Добавить</Button>
                      </SqlDataset>

                      <Select value={addType} onValueChange={setAddType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Тип датасета" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sql">SQL</SelectItem>
                          <SelectItem value="sqlBuilder">Редактор запроса</SelectItem>
                          <SelectItem value="merge">Объединение</SelectItem>
                          <SelectItem value="modification">Модификация</SelectItem>
                        </SelectContent>
                      </Select>

                      <SqlBuilderDataset isLoading={isLoading} suggestions={['main', 'database']}>
                        <Button>Редактор запроса</Button>
                      </SqlBuilderDataset>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Выгрузки</CardTitle>
                  <CardDescription>
                    Укажите выгрузки, которые будут использоваться в миграции.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex w-full max-w-xl flex-col gap-6">
                    {fetchConfigs.length == 0 && (
                      <Alert>
                        <FileWarning />
                        <AlertTitle>
                          Предупреждение: сначала добавьте датасеты, чтобы создать выгрузки
                        </AlertTitle>
                      </Alert>
                    )}

                    {fetchConfigs.length > 0 && <Button>Добавить</Button>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 items-center">
          <Button variant="outline">
            <Trash />
            Удалить
          </Button>
          <Button onClick={onSave} disabled={saveLoading}>
            <Save />
            {saveLoading ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </>
  )
}

export function MyItem({ name, icon }: { name: string; icon: string }) {
  return (
    <Item variant="outline">
      <ItemMedia>
        <img src={icon} alt={name} width={32} height={32} className="object-cover grayscale" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="line-clamp-1">
          Sql запрос - <span className="text-muted-foreground">Источник данных 1</span>
        </ItemTitle>
        <ItemDescription>
          <code>SELECT * FROM b_iblock_element</code>{' '}
        </ItemDescription>
      </ItemContent>
      <ItemContent className="flex-none text-center">
        <ItemDescription className="space-x-2">
          <Button size="icon" variant="outline">
            <Trash />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline">
                <Pencil />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove
                  your data from our servers.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}

MigrationEdit.layout = (page: React.ReactNode) => {
  return <RootLayout title="Миграции">{page}</RootLayout>
}

export default MigrationEdit

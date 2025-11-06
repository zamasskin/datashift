import type Migration from '#models/migration'
import { Head, router, usePage } from '@inertiajs/react'
import { ArrowDownUp, FileWarning, Pencil, Plus, Save, Settings, Trash } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MergeCard } from '~/components/migrations/cards/merge-card'
import { ModificationCard } from '~/components/migrations/cards/modification-card'
import { SqlBuilderCard } from '~/components/migrations/cards/sql-builder-card'
import { SqlCard } from '~/components/migrations/cards/sql-card'
import { CronExpressionEditor } from '~/components/migrations/cron-expression-editor'
import { ParamsEditor as MigrationParamsEditor } from '~/components/migrations/params-editor'
import { MergeDataset } from '~/components/migrations/datasets/merge-dataset'
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
import { Switch } from '~/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ModificationDataset } from '~/components/migrations/datasets/modification-dataset'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { FetchConfig } from '#interfaces/fetchсonfigs'

const MigrationEdit = ({ migration }: { migration: Migration }) => {
  const { props } = usePage<{ csrfToken?: string }>()
  const [name, setName] = useState(migration.name)
  const [cronExpression, setCronExpression] = useState(migration.cronExpression)
  const [fetchConfigs, setFetchConfigs] = useState<FetchConfig[]>(migration.fetchConfigs || [])
  const [saveMappings, setSaveMappings] = useState(migration.saveMappings || [])
  const [params, setParams] = useState(migration.params || [])
  const [isActive, setIsActive] = useState(migration.isActive || false)
  const [addType, setAddType] = useState('sql')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [prevResults, setPrevResults] = useState<Record<string, string[]>>({})

  const [newDatasetOpen, setNewDatasetOpen] = useState('')

  const [saveLoading, setSaveLoading] = useState(false)
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})

  const suggestions = ['main', 'database']

  const paramKeys = useMemo(() => params.map((p) => p.key as string), [params])

  const onSave = () => {
    setSaveLoading(true)
    setSaveErrors({})
    console.log({ name, cronExpression, isActive, fetchConfigs, saveMappings, params })
    router.put(
      `/migrations/${migration.id}`,
      { name, cronExpression, isActive, fetchConfigs, saveMappings, params },
      {
        preserveScroll: true,
        headers: props.csrfToken ? { 'X-CSRF-TOKEN': props.csrfToken } : undefined,
        onError: (errors: any) => {
          console.log(errors)
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

  const handleSave = (config: FetchConfig) => {
    setFetchConfigs((old) => old.map((item) => (item.id == config.id ? config : item)))
  }

  return (
    <>
      <Head title="Миграции" />
      <div className="px-4 lg:px-6 space-y-6">
        <Item variant="outline">
          <ItemContent>
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="airplane-mode">Активно</Label>
            </div>
          </ItemContent>
          <ItemContent>
            <div className="flex gap-2">
              <Button variant="outline">
                <Trash />
                Удалить
              </Button>

              <Button onClick={onSave} disabled={saveLoading}>
                <Save />
                {saveLoading ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </div>
          </ItemContent>
        </Item>

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

        <Tabs defaultValue="config" className="mt-6">
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
          <TabsContent value="config" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2 lg:auto-rows-fr">
              <Card>
                <CardHeader>
                  <CardTitle>Параметры</CardTitle>
                  <CardDescription>
                    Добавьте настройки, которые будут использоваться в миграции.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MigrationParamsEditor params={params} onChange={setParams} />
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
                  <div className=" space-y-4">
                    <CronExpressionEditor config={cronExpression} onChange={setCronExpression} />
                    {saveErrors?.cronExpression && (
                      <p className="text-sm text-destructive">{saveErrors.cronExpression}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="migrations" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2 lg:auto-rows-fr">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Датасеты</CardTitle>
                  <CardDescription>
                    Добавьте датасеты, которые будут использоваться в миграции.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex w-full flex-col gap-6">
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
                          {conf?.type == 'sql_builder' && (
                            <SqlBuilderCard
                              suggestions={suggestions}
                              isLoading={isLoading}
                              config={conf}
                              onRemove={handleRemove}
                              onSave={handleSave}
                            />
                          )}
                          {conf?.type == 'merge' && (
                            <MergeCard
                              config={conf}
                              isLoading={isLoading}
                              onRemove={handleRemove}
                              onSave={handleSave}
                              datasetsConfigs={[
                                { id: 'aa', title: 'sql', columns: ['aa1', 'aa2'] },
                                { id: 'bb', title: 'dataset1', columns: ['bb1', 'bb2'] },
                                { id: 'cc', title: 'custom', columns: ['cc1', 'cc2'] },
                              ]}
                            />
                          )}
                          {conf?.type == 'modification' && (
                            <ModificationCard
                              config={conf}
                              isLoading={isLoading}
                              onRemove={handleRemove}
                              onSave={handleSave}
                              datasetsConfigs={[
                                { id: 'aa', title: 'sql', columns: ['aa1', 'aa2'] },
                                { id: 'bb', title: 'dataset1', columns: ['bb1', 'bb2'] },
                                { id: 'cc', title: 'custom', columns: ['cc1', 'cc2'] },
                              ]}
                            />
                          )}
                        </div>
                      ))}
                    </ItemGroup>

                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            <Plus />
                            Добавить датасет
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="start">
                          <DropdownMenuItem onClick={() => setNewDatasetOpen('sql')}>
                            SQL запрос
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setNewDatasetOpen('sql_builder')}>
                            Редактор запроса
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setNewDatasetOpen('merge')}>
                            Объединение
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setNewDatasetOpen('modification')}>
                            Модификация
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <SqlDataset
                        open={newDatasetOpen == 'sql'}
                        onOpenChange={(val) => setNewDatasetOpen(val ? 'sql' : '')}
                        onSave={(config) => setFetchConfigs([...fetchConfigs, config])}
                        prevResults={prevResults}
                        paramKeys={paramKeys}
                        isLoading={isLoading}
                      />

                      <SqlBuilderDataset
                        open={newDatasetOpen == 'sql_builder'}
                        onOpenChange={(val) => setNewDatasetOpen(val ? 'sql_builder' : '')}
                        isLoading={isLoading}
                        suggestions={suggestions}
                        onSave={(config) => setFetchConfigs([...fetchConfigs, config])}
                      />

                      <MergeDataset
                        open={newDatasetOpen == 'merge'}
                        onOpenChange={(val) => setNewDatasetOpen(val ? 'merge' : '')}
                        isLoading={isLoading}
                        datasetsConfigs={[
                          { id: 'aa', title: 'sql', columns: ['aa1', 'aa2'] },
                          { id: 'bb', title: 'dataset1', columns: ['bb1', 'bb2'] },
                          { id: 'cc', title: 'custom', columns: ['cc1', 'cc2'] },
                        ]}
                        onSave={(config) => setFetchConfigs([...fetchConfigs, config])}
                      />

                      <ModificationDataset
                        open={newDatasetOpen == 'modification'}
                        onOpenChange={(val) => setNewDatasetOpen(val ? 'modification' : '')}
                        datasetsConfigs={[
                          { id: 'aa', title: 'sql', columns: ['aa1', 'aa2'] },
                          { id: 'bb', title: 'dataset1', columns: ['bb1', 'bb2'] },
                          { id: 'cc', title: 'custom', columns: ['cc1', 'cc2'] },
                        ]}
                        onSave={(config) => setFetchConfigs([...fetchConfigs, config])}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Выгрузки</CardTitle>
                  <CardDescription>
                    Укажите выгрузки, которые будут использоваться в миграции.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
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

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Результат</CardTitle>
                <CardDescription></CardDescription>
              </CardHeader>
              <CardContent>Тут будет результат</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

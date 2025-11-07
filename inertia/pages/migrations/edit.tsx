import type Migration from '#models/migration'
import { Head, router, usePage } from '@inertiajs/react'
import { ArrowDownUp, FileWarning, Plus, Save, Settings, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { ItemGroup, Item, ItemContent } from '~/components/ui/item'
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
import { FetchConfig, FetchConfigMeta, FetchConfigResult } from '#interfaces/fetchсonfigs'
import { SaveMappings } from '~/components/migrations/save-mappings'
import { FetchConfigResultCard } from '~/components/migrations/fetch_config_result_card'
import _ from 'lodash'

const MigrationEdit = ({ migration }: { migration: Migration }) => {
  const { props } = usePage<{ csrfToken?: string }>()
  const [name, setName] = useState(migration.name)
  const [cronExpression, setCronExpression] = useState(migration.cronExpression)
  const [fetchConfigs, setFetchConfigs] = useState<FetchConfig[]>(migration.fetchConfigs || [])
  const [saveMappings, setSaveMappings] = useState(migration.saveMappings || [])
  const [params, setParams] = useState(migration.params || [])
  const [isActive, setIsActive] = useState(migration.isActive || false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [prevResults, setPrevResults] = useState<FetchConfigResult>()
  const [meta, setMeta] = useState<FetchConfigMeta>()
  const [previewPages, setPreviewPages] = useState<Record<string, number>>({})

  const [newDatasetOpen, setNewDatasetOpen] = useState('')

  const [saveLoading, setSaveLoading] = useState(false)
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})

  const suggestions = ['main', 'database']

  const paramKeys = useMemo(() => params.map((p) => p.key as string), [params])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch('/migrations/fetch-config-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': props.csrfToken || '' },
        body: JSON.stringify({ fetchConfigs, params, pages: previewPages }),
      })
      const json = await response.json()
      if (json.error) {
        console.log(json.error)
        setError(json.error)
        return
      }

      console.log(json)
      setPrevResults(json.data)
      setMeta(json.meta)
    } catch (e) {
      console.log(e)
      setError(e.message || 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [params, fetchConfigs])

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

  const suggestionsById = useMemo(() => {
    const map: Record<string, Record<string, string[]>> = {}
    const prefix: FetchConfig[] = []
    for (const fetchConfig of fetchConfigs) {
      const index = fetchConfigs.findIndex((cfg) => cfg.id === fetchConfig.id)
      const ids = prefix.slice(0, index).map((cfg) => cfg.id)
      const fields = _.pick(meta?.suggestions || {}, ids)
      map[fetchConfig.id] = {
        params: meta?.suggestions?.params || [],
        ...fields,
      }
      prefix.push(fetchConfig)
    }

    return map
  }, [fetchConfigs, meta])

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

        <Tabs defaultValue="migrations" className="mt-6">
          <TabsList>
            <TabsTrigger value="migrations">
              <ArrowDownUp />
              Миграции
            </TabsTrigger>

            <TabsTrigger value="config">
              <Settings />
              Настройки
            </TabsTrigger>
          </TabsList>

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
                              suggestions={suggestionsById[conf.id]}
                              isLoading={isLoading}
                              config={conf}
                              onRemove={handleRemove}
                              onUpdate={handleSave}
                              page={previewPages[conf.id] || 1}
                              onChangePage={(page) => {
                                setPreviewPages((old) => ({ ...old, [conf.id]: page }))
                                // Обновляем предпросмотр после смены страницы
                                loadData()
                              }}
                            />
                          )}
                          {conf?.type == 'sql_builder' && (
                            <SqlBuilderCard
                              suggestions={suggestionsById[conf.id]}
                              isLoading={isLoading}
                              config={conf}
                              onRemove={handleRemove}
                              onSave={handleSave}
                              page={previewPages[conf.id] || 1}
                              onChangePage={(page) => {
                                setPreviewPages((old) => ({ ...old, [conf.id]: page }))
                                loadData()
                              }}
                            />
                          )}
                          {conf?.type == 'merge' && (
                            <MergeCard
                              suggestions={suggestionsById[conf.id]}
                              config={conf}
                              isLoading={isLoading}
                              onRemove={handleRemove}
                              onSave={handleSave}
                            />
                          )}
                          {conf?.type == 'modification' && (
                            <ModificationCard
                              config={conf}
                              isLoading={isLoading}
                              onRemove={handleRemove}
                              onSave={handleSave}
                              suggestions={suggestionsById[conf.id]}
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
                        suggestions={meta?.suggestions || {}}
                        onOpenChange={(val) => setNewDatasetOpen(val ? 'sql' : '')}
                        onSave={(config) => setFetchConfigs([...fetchConfigs, config])}
                        isLoading={isLoading}
                      />

                      <SqlBuilderDataset
                        open={newDatasetOpen == 'sql_builder'}
                        onOpenChange={(val) => setNewDatasetOpen(val ? 'sql_builder' : '')}
                        isLoading={isLoading}
                        suggestions={meta?.suggestions || {}}
                        onSave={(config) => setFetchConfigs([...fetchConfigs, config])}
                      />

                      <MergeDataset
                        open={newDatasetOpen == 'merge'}
                        suggestions={meta?.suggestions || {}}
                        onOpenChange={(val) => setNewDatasetOpen(val ? 'merge' : '')}
                        isLoading={isLoading}
                        onSave={(config) => setFetchConfigs([...fetchConfigs, config])}
                      />

                      <ModificationDataset
                        open={newDatasetOpen == 'modification'}
                        onOpenChange={(val) => setNewDatasetOpen(val ? 'modification' : '')}
                        suggestions={meta?.suggestions || {}}
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
                    <SaveMappings
                      error={error}
                      isLoading={isLoading}
                      fetchConfigsLength={fetchConfigs.length}
                      resultColumns={
                        prevResults?.dataType === 'array_columns'
                          ? prevResults?.meta?.columns || []
                          : []
                      }
                      sources={[]}
                      tables={[]}
                      fields={[]}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Результат</CardTitle>
                <CardDescription></CardDescription>
              </CardHeader>
              <CardContent>
                <FetchConfigResultCard result={prevResults} isLoading={isLoading} error={error} />
              </CardContent>
            </Card>
          </TabsContent>
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
        </Tabs>
      </div>
    </>
  )
}

MigrationEdit.layout = (page: React.ReactNode) => {
  return <RootLayout title="Миграции">{page}</RootLayout>
}

export default MigrationEdit

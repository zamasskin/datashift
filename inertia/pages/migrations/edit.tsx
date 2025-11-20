import type Migration from '#models/migration'
import { Head, router, usePage } from '@inertiajs/react'
import {
  ArrowDownUp,
  CircleStop,
  Play,
  Plus,
  Save,
  Settings,
  SquareStop,
  Trash,
} from 'lucide-react'
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
import { cn } from '~/lib/utils'
import { useMigrationRuns } from '~/store/migrations'
import { Progress } from '~/components/ui/progress'
import { Spinner } from '~/components/ui/spinner'
import { DashboardAreaChart } from '~/components/charts/area-chart'
import { toast } from 'sonner'

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
  const channelId = `migration:${migration.id}`
  const [newDatasetOpen, setNewDatasetOpen] = useState('')
  const [fetchRunning, setFetchRunning] = useState(false)
  const [fetchStopped, setFetchStopped] = useState(false)

  const [saveLoading, setSaveLoading] = useState(false)
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})

  const { runnings } = useMigrationRuns()

  const running = useMemo(
    () =>
      runnings.find(
        (r) => r.migrationId === migration.id && r.trigger === 'manual' && r.status === 'running'
      ),
    [runnings]
  )

  const migrationRunnings = useMemo(
    () => runnings.filter((r) => r.migrationId === migration.id && r.status === 'running'),
    [runnings]
  )

  const showPlay = useMemo(
    () => fetchConfigs.length > 0 && saveMappings.length > 0,
    [fetchConfigs, saveMappings]
  )

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
          // Toast на ошибку сохранения
          const firstMsg = Object.values(map)[0] || 'Не удалось сохранить миграцию'
          toast.error(firstMsg)
        },
        onSuccess: () => {
          setSaveLoading(false)
          // Toast на успешное сохранение
          toast.success('Миграция сохранена')
        },
      }
    )
  }

  const onDelete = () => {
    if (!confirm(`Удалить миграцию #${migration.id}?`)) return
    let handled = false
    router.delete('/migrations', {
      data: { ids: [migration.id], redirectTo: '/migrations' },
      preserveScroll: true,
      onSuccess: () => {
        handled = true
        toast.success('Миграция удалена')
      },
      onError: () => {
        handled = true
        toast.error('Не удалось удалить миграцию')
      },
      // Сервер сделает редирект, но на случай JSON-ответа — подстрахуемся
      onFinish: () => {
        if (!handled) toast.success('Миграция удалена')
        router.visit('/migrations')
      },
    })
  }

  const handleRemove = (id: string) => {
    setFetchConfigs((old) => old.filter((cfg) => cfg.id !== id))
  }

  const handleSave = (config: FetchConfig) => {
    setFetchConfigs((old) => old.map((item) => (item.id == config.id ? config : item)))
  }

  const handleRun = async () => {
    setFetchRunning(true)
    try {
      await fetch('/migrations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': props.csrfToken || '' },
        body: JSON.stringify({
          id: migration.id,
          saveMappings,
          fetchConfigs,
          params,
          channelId,
        }),
      })
    } finally {
      setTimeout(() => setFetchRunning(false), 300)
    }
  }

  const handleStop = async (trigger = 'manual') => {
    setFetchStopped(true)
    try {
      await fetch('/migrations/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': props.csrfToken || '' },
        body: JSON.stringify({ migrationId: migration.id, trigger: trigger }),
      })
    } finally {
      setTimeout(() => setFetchStopped(false), 300)
    }
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
        {(() => {
          const metrics = useMigrationMetrics(migration.id)
          return (
            <DashboardAreaChart
              title="Активность миграции"
              hint="Запуски, успешные и отменённые, и ошибки"
              badge="30 дн."
              dataRuns={metrics.runs}
              dataErrors={metrics.errors}
              dataSuccess={metrics.runsSuccess}
              dataCanceled={metrics.runsCanceled}
            />
          )
        })()}

        {migrationRunnings.map((running, rIdx) => (
          <div key={`running-${rIdx}`} className="flex gap-2 items-center">
            <div className="space-y-3 flex-1">
              {running?.progress.map((percent, idx) => (
                <div className="flex items-center gap-3" key={idx}>
                  <Progress value={percent} className="h-2 rounded-full" />
                  <span className="text-sm font-medium text-muted-foreground">{percent}%</span>
                </div>
              ))}
            </div>

            {running?.progress.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">{running.trigger}</div>

                <Button
                  variant="ghost"
                  onClick={() => handleStop(running.trigger)}
                  disabled={fetchStopped}
                >
                  <CircleStop className=" text-destructive" />
                </Button>
              </div>
            )}
          </div>
        ))}

        <Item variant="outline">
          <ItemContent>
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="airplane-mode">Активно</Label>
            </div>
          </ItemContent>
          <ItemContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onDelete}>
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

        <div className={cn('grid grid-cols-1 items-end gap-4', showPlay ? 'md:grid-cols-2' : '')}>
          <div className="space-y-2">
            <div className="grid w-full max-w-sm items-center gap-3">
              <Label htmlFor="name">Название</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="w-[320px]" />
              {saveErrors?.name && <p className="text-sm text-destructive">{saveErrors.name}</p>}
            </div>
          </div>
          {showPlay && (
            <div className="flex justify-start md:justify-end">
              <div className="flex gap-2">
                {running ? (
                  <Button
                    variant="destructive"
                    onClick={() => handleStop()}
                    disabled={fetchStopped}
                  >
                    Остановить
                    {fetchStopped && <Spinner className="h-4 w-4 animate-spin" />}
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={handleRun} disabled={fetchRunning}>
                    <Play />
                    Запустить
                    {fetchRunning && <Spinner className="h-4 w-4 animate-spin" />}
                  </Button>
                )}
              </div>
            </div>
          )}
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
                      saveMappings={saveMappings}
                      onSave={setSaveMappings}
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

function useMigrationMetrics(migrationId: number) {
  const [runs, setRuns] = useState<Array<{ date: string; value: number }>>([])
  const [errors, setErrors] = useState<Array<{ date: string; value: number }>>([])
  const [runsSuccess, setRunsSuccess] = useState<Array<{ date: string; value: number }>>([])
  const [runsCanceled, setRunsCanceled] = useState<Array<{ date: string; value: number }>>([])
  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch(`/metrics/migration/${migrationId}?days=30`, {
          credentials: 'same-origin',
          headers: { 'accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
        if (!res.ok) return
        const json = await res.json()
        const runsRaw = json?.series?.migrationRuns
        const errorsRaw = json?.series?.errors
        const runsSuccessRaw = json?.series?.runsSuccess
        const runsCanceledRaw = json?.series?.runsCanceled
        const toPoints = (raw: any): Array<{ date: string; value: number }> =>
          Array.isArray(raw)
            ? raw
            : Object.entries(raw ?? {}).map(([date, value]) => ({
                date,
                value: Number(value) || 0,
              }))
        if (!aborted) {
          setRuns(toPoints(runsRaw))
          setErrors(toPoints(errorsRaw))
          setRunsSuccess(toPoints(runsSuccessRaw))
          setRunsCanceled(toPoints(runsCanceledRaw))
        }
      } catch {}
    })()
    return () => {
      aborted = true
    }
  }, [migrationId])
  return { runs, errors, runsSuccess, runsCanceled }
}

MigrationEdit.layout = (page: React.ReactNode) => {
  return <RootLayout title="Миграции">{page}</RootLayout>
}

export default MigrationEdit

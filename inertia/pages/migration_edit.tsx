import Migration from '#models/migration'
import { Head, router } from '@inertiajs/react'
import {
  AlarmClockCheck,
  ArrowDownToLine,
  ArrowUpToLine,
  Pencil,
  RectangleEllipsis,
} from 'lucide-react'
import { useState } from 'react'
import { RootLayout } from '~/components/root-layout'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { CronExpressionEditor } from '~/components/migrations/cron-expression-editor'

const MigrationEdit = ({ migration }: { migration: Migration }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(migration.name || '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [cron, setCron] = useState(migration.cronExpression || '')
  const [cronSaving, setCronSaving] = useState(false)
  const [cronError, setCronError] = useState<string | null>(null)

  const startEdit = () => {
    setIsEditing(true)
    setName(migration.name || '')
    setError(null)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setName(migration.name || '')
    setError(null)
  }

  const saveName = () => {
    setSaving(true)
    setError(null)
    router.put(
      `/migrations/${migration.id}`,
      { name },
      {
        preserveScroll: true,
        onError: (errors: any) => {
          const msg =
            (errors?.name && Array.isArray(errors.name) ? errors.name[0] : errors?.name) ||
            errors?.error ||
            'Укажите корректное имя'
          setError(String(msg))
          setSaving(false)
        },
        onSuccess: () => {
          setSaving(false)
          setIsEditing(false)
        },
      }
    )
  }

  const saveCron = async () => {
    setCronSaving(true)
    setCronError(null)
    return new Promise<void>((resolve, reject) => {
      router.put(
        `/migrations/${migration.id}`,
        { cronExpression: cron },
        {
          preserveScroll: true,
          onError: (errors: any) => {
            const msg =
              (errors?.cronExpression && Array.isArray(errors.cronExpression)
                ? errors.cronExpression[0]
                : errors?.cronExpression) ||
              errors?.error ||
              'Укажите корректное CRON-выражение'
            setCronError(String(msg))
            setCronSaving(false)
            reject(new Error(String(msg)))
          },
          onSuccess: () => {
            setCronSaving(false)
            setCronError(null)
            resolve()
          },
        }
      )
    })
  }

  return (
    <>
      <Head title="Миграции" />
      <div className="px-4 lg:px-6 space-y-4">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="w-[320px]" />
            <Button onClick={saveName} disabled={saving}>
              Сохранить
            </Button>
            <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
              Отмена
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{migration.name}</h1>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={startEdit}
              aria-label="Редактировать"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <Tabs defaultValue="params" className="mt-8">
          <TabsList>
            <TabsTrigger value="params">
              <RectangleEllipsis />
              Парамеры
            </TabsTrigger>
            <TabsTrigger value="request">
              <ArrowDownToLine />
              Датасеты
            </TabsTrigger>
            <TabsTrigger value="response">
              <ArrowUpToLine />
              Выгрузки
            </TabsTrigger>
            <TabsTrigger value="task">
              <AlarmClockCheck />
              Задание
            </TabsTrigger>
          </TabsList>
          <TabsContent value="params" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Параметры</CardTitle>
                <CardDescription>
                  Добавьте параметры, которые будут использоваться в миграции.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Здесь будет интерфейс управления параметрами миграции.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="request" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Датасеты</CardTitle>
                <CardDescription>
                  Добавьте датасеты, которые будут использоваться в миграции.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Здесь будет интерфейс управления датасетами миграции.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="response" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Выгрузки</CardTitle>
                <CardDescription>
                  Добавьте выгрузки, которые будут использоваться в миграции.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Здесь будет интерфейс управления выгрузками миграции.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="task" className="mt-4">
            <CronExpressionEditor
              value={cron}
              onChange={setCron}
              onSave={saveCron}
              saving={cronSaving}
              error={cronError}
            />
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

import Migration from '#models/migration'
import { Head, router } from '@inertiajs/react'
import { AlarmClockCheck, ArrowDownToLine, ArrowUpToLine, Pencil } from 'lucide-react'
import { useState } from 'react'
import { RootLayout } from '~/components/root-layout'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

const MigrationEdit = ({ migration }: { migration: Migration }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(migration.name || '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

        <Tabs defaultValue="request" className="mt-8">
          <TabsList>
            <TabsTrigger value="request">
              <ArrowDownToLine />
              Датасеты
            </TabsTrigger>
            <TabsTrigger value="response">
              <ArrowUpToLine />
              Миграторы
            </TabsTrigger>
            <TabsTrigger value="task">
              <AlarmClockCheck />
              Задание
            </TabsTrigger>
          </TabsList>
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
                <CardTitle>Миграторы</CardTitle>
                <CardDescription>
                  Добавьте миграторы, которые будут использоваться в миграции.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Здесь будет интерфейс управления миграторами миграции.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="task" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Задание</CardTitle>
                <CardDescription>Укажите задание миграции.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Здесь будет интерфейс управления заданием миграции.
                </p>
              </CardContent>
            </Card>
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

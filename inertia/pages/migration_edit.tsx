import Migration from '#models/migration'
import { Head, router } from '@inertiajs/react'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { RootLayout } from '~/components/root-layout'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

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
      </div>
    </>
  )
}

MigrationEdit.layout = (page: React.ReactNode) => {
  return <RootLayout title="Миграции">{page}</RootLayout>
}

export default MigrationEdit

"use client"

import { useEffect, useState } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Check, Pencil, X } from 'lucide-react'

export type CronExpressionEditorProps = {
  value: string
  onChange: (value: string) => void
  onSave?: (value: string) => void | Promise<void>
  saving?: boolean
  error?: string | null
}

export function CronExpressionEditor({ value, onChange, onSave, saving, error }: CronExpressionEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [local, setLocal] = useState(value || '')

  useEffect(() => {
    if (!isEditing) {
      setLocal(value || '')
    }
  }, [value, isEditing])

  const startEdit = () => {
    setLocal(value || '')
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setLocal(value || '')
    onChange(value || '')
    setIsEditing(false)
  }

  const save = async () => {
    try {
      await onSave?.(local)
      setIsEditing(false)
    } catch (e) {
      // Ошибку отобразит родитель через prop error
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Задание</CardTitle>
        <CardDescription>Укажите задание миграции.</CardDescription>
        <CardAction className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" size="sm" onClick={save} disabled={!!saving}>
                <Check className="size-4" />
                Сохранить
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={!!saving}>
                <X className="size-4" />
                Отмена
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={startEdit}
              aria-label="Редактировать cron"
              title="Редактировать cron"
            >
              <Pencil className="size-4" />
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">CRON выражение</div>
            <Input
              value={local}
              onChange={(e) => {
                setLocal(e.target.value)
                onChange(e.target.value)
              }}
              placeholder="Например: 0 0 * * *"
              className="max-w-[360px]"
              aria-invalid={!!error}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Текущее CRON выражение</div>
            <div className="text-sm">{(value || '').trim() || 'Не задано'}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

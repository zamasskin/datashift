"use client"

import { useEffect, useState } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
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

  const [mode, setMode] = useState<'exact' | 'every'>('exact')
  const [time, setTime] = useState('')
  const [everyMinutes, setEveryMinutes] = useState<number | undefined>(undefined)
  const [everyHours, setEveryHours] = useState<number | undefined>(undefined)
  const [everyDays, setEveryDays] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!isEditing) {
      setLocal(value || '')
    }
  }, [value, isEditing])

  const toCronExact = (t: string) => {
    const m = t.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
    if (!m) return local || ''
    const hh = m[1]
    const mm = m[2]
    return `${mm} ${hh} * * *`
  }

  const toCronEvery = (m?: number, h?: number, d?: number) => {
    if (m && m > 0) return `*/${m} * * * *`
    if (h && h > 0) return `0 */${h} * * *`
    if (d && d > 0) return `0 0 */${d} * *`
    return local || ''
  }

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
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Режим</div>
              <Select value={mode} onValueChange={(v) => setMode(v as 'exact' | 'every')}>
                <SelectTrigger className="max-w-[240px]">
                  <SelectValue placeholder="Выберите режим" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">В точное время</SelectItem>
                  <SelectItem value="every">Каждые</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'exact' ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Время (HH:mm)</div>
                <Input
                  value={time}
                  onChange={(e) => {
                    const next = e.target.value
                    setTime(next)
                    const cron = toCronExact(next)
                    setLocal(cron)
                    onChange(cron)
                  }}
                  placeholder="например: 14:30"
                  className="max-w-[160px]"
                  aria-invalid={!!error}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Интервал</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Минут</div>
                    <Input
                      type="number"
                      min={1}
                      value={everyMinutes ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : Math.max(1, Number(e.target.value))
                        setEveryMinutes(val)
                        if (val) {
                          setEveryHours(undefined)
                          setEveryDays(undefined)
                        }
                        const cron = toCronEvery(val, everyHours, everyDays)
                        setLocal(cron)
                        onChange(cron)
                      }}
                      placeholder="N"
                      className="max-w-[120px]"
                      aria-invalid={!!error}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Часов</div>
                    <Input
                      type="number"
                      min={1}
                      value={everyHours ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : Math.max(1, Number(e.target.value))
                        setEveryHours(val)
                        if (val) {
                          setEveryMinutes(undefined)
                          setEveryDays(undefined)
                        }
                        const cron = toCronEvery(everyMinutes, val, everyDays)
                        setLocal(cron)
                        onChange(cron)
                      }}
                      placeholder="N"
                      className="max-w-[120px]"
                      aria-invalid={!!error}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Дней</div>
                    <Input
                      type="number"
                      min={1}
                      value={everyDays ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : Math.max(1, Number(e.target.value))
                        setEveryDays(val)
                        if (val) {
                          setEveryMinutes(undefined)
                          setEveryHours(undefined)
                        }
                        const cron = toCronEvery(everyMinutes, everyHours, val)
                        setLocal(cron)
                        onChange(cron)
                      }}
                      placeholder="N"
                      className="max-w-[120px]"
                      aria-invalid={!!error}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Заполняйте одно поле. Используется наименьшая единица.
                </div>
              </div>
            )}

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

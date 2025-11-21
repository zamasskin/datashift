import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Separator } from '~/components/ui/separator'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Link, usePage } from '@inertiajs/react'
import { useNotifications } from '~/store/notifications'
import { useI18n } from '~/hooks/useI18nLocal'
import {
  IconX,
  IconAlertCircle,
  IconInfoCircle,
  IconAlertTriangle,
  IconTrash,
  IconLoader2,
} from '@tabler/icons-react'

type EventItem = {
  id: number
  createdAt?: string
  type?: 'error' | 'notify' | string
  errorId?: number
  message?: string | null
  error?: {
    id: number
    uuid?: string
    message: string | null
    severity: 'error' | 'warning' | 'info'
    status: 'open' | 'resolved'
  }
}

export function NotificationsButton() {
  const [open, setOpen] = useState(false)
  const { props } = usePage<{
    events?: { items: EventItem[]; total: number }
    csrfToken?: string
  }>()
  const { t } = useI18n()
  const { items, removeItem, clear } = useNotifications()
  const [clearing, setClearing] = useState(false)
  const count = items.length

  // SSE уже подключен в GlobalSseProvider, элементы берём из стора

  const mute = async (id: number) => {
    try {
      const res = await fetch('/events/mute', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'content-type': 'application/json',
          ...(props.csrfToken ? { 'X-CSRF-Token': props.csrfToken } : {}),
        },
        body: JSON.stringify({ id }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && (json?.updated ?? 0) > 0) {
        removeItem(id)
      }
    } catch {}
  }

  const clearAll = async () => {
    if (items.length === 0) return
    setClearing(true)
    try {
      const res = await fetch('/events/clear', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'content-type': 'application/json',
          ...(props.csrfToken ? { 'X-CSRF-Token': props.csrfToken } : {}),
        },
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && (json?.updated ?? 0) > 0) {
        clear()
      }
    } catch {}
    setClearing(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('notifications.button.aria', 'Ошибки')}
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px]"
            >
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-80 p-0 max-h-[70vh] overflow-hidden"
      >
        <div className="p-3">
          <div className="text-sm font-medium">
            {t('notifications.title', 'Уведомления')}
          </div>
        </div>
        <Separator />
        <div className="max-h-[60vh]">
          <ScrollArea
            type="always"
            className="h-full pr-1 [&>[data-radix-scroll-area-viewport]]:max-h-96"
          >
            <div className="p-2">
              {items.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground">
                  {t('notifications.empty', 'Нет уведомлений')}
                </div>
              ) : (
                items.map((e) => {
                  const errId = e.error?.id ?? e.errorId
                  const isError = (e.type ?? 'notify') === 'error'
                  const content = (
                    <div className="text-sm text-foreground/90 line-clamp-2">
                      {e.message ?? e.error?.message ?? t('notifications.misc.emDash', '—')}
                    </div>
                  )
                  return (
                    <div
                      key={e.id}
                      className="flex items-start gap-2 px-2 py-2 hover:bg-muted rounded-sm"
                    >
                      <EventIcon type={e.type} />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">
                          <span className="mr-1">#{e.id}</span>
                          <span>{formatUtcRu(e.createdAt)}</span>
                        </div>
                        {isError && errId ? (
                          <Link
                            href={`/errors/${errId}`}
                            className="text-sm font-medium text-foreground hover:underline"
                            onClick={() => setOpen(false)}
                          >
                            {e.message ?? e.error?.message ?? t('notifications.misc.emDash', '—')}
                          </Link>
                        ) : (
                          content
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => mute(e.id)}
                        aria-label={t('notifications.item.muteAria', 'Отключить уведомление')}
                      >
                        <IconX className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />
        <div className="p-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center gap-2"
            onClick={clearAll}
            disabled={items.length === 0 || clearing}
            title={t('notifications.clear.title', 'Отключить все уведомления')}
          >
            {clearing ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconTrash className="h-4 w-4" />
            )}
            <span>
              {t('notifications.clear.button', 'Очистить уведомления')}
              {count > 0 ? ` (${count})` : ''}
            </span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function EventIcon({ type }: { type?: string }) {
  const cls = 'mt-0.5 h-4 w-4 shrink-0'
  if (type === 'error') return <IconAlertCircle className={cls + ' text-destructive'} />
  if (type === 'warning') return <IconAlertTriangle className={cls + ' text-yellow-500'} />
  return <IconInfoCircle className={cls + ' text-blue-500'} />
}

function formatUtcRu(input?: string | null) {
  if (!input) return '—'
  const d = new Date(input)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

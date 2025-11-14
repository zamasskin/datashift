import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Separator } from '~/components/ui/separator'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Link, router } from '@inertiajs/react'

type LatestError = {
  id: number
  severity: 'error' | 'warning' | 'info'
  message: string | null
  occurredAt: string | null
  status: 'open' | 'resolved'
  code: string | null
  migrationId: number | null
  migrationRunId: number | null
}

export function NotificationsButton() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<LatestError[]>([])
  const count = items.length

  useEffect(() => {
    if (!open) return
    void fetchLatest()
  }, [open])

  const fetchLatest = async () => {
    try {
      const res = await fetch('/errors/latest')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {}
  }

  // Удалены действия пометки прочитанного и отключения уведомлений

  

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Ошибки">
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
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3">
          <div className="text-sm font-medium">Последние ошибки</div>
        </div>
        <Separator />
        <ScrollArea className="max-h-64">
          <div className="p-2">
            {items.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground">Ошибок не найдено</div>
            ) : (
              items.map((e) => (
                <div key={e.id} className="flex items-start gap-2 px-2 py-2">
                  <div className={severityDotClass(e.severity)} />
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium">#{e.id}</span>{' '}
                      <span className="text-muted-foreground">{formatUtcRu(e.occurredAt)}</span>
                    </div>
                    <div className="text-sm text-foreground/90 line-clamp-2">{e.message || '—'}</div>
                    {/* Удалены действия управления прочитанностью/уведомлениями */}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/errors" onClick={() => setOpen(false)}>
              Перейти ко всем ошибкам
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function severityDotClass(sev: LatestError['severity']) {
  const base = 'mt-1 h-2 w-2 shrink-0 rounded-full'
  switch (sev) {
    case 'error':
      return base + ' bg-destructive'
    case 'warning':
      return base + ' bg-yellow-500'
    case 'info':
    default:
      return base + ' bg-blue-500'
  }
}

function formatUtcRu(input?: string | null) {
  if (!input) return '—'
  const d = new Date(input)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}
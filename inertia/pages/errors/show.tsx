import { Head, Link, usePage } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'

type ErrorDetails = {
  id: number
  uuid: string
  message: string | null
  severity: 'error' | 'warning' | 'info'
  status: 'open' | 'resolved'
  code: string | null
  occurredAt: string | null
  migrationId: number | null
  migrationRunId: number | null
  trigger: 'manual' | 'cron' | 'api' | null
  source: 'runner' | 'scheduler' | 'system' | null
  environment: string | null
  hostname: string | null
  stack: string | null
  context: Record<string, any>
}

type ErrorShowProps = {
  error: ErrorDetails
}

const ErrorShow = () => {
  const { props } = usePage<ErrorShowProps>()
  const error = props.error

  // Удалены действия пометки как прочитанное и отключения уведомлений

  return (
    <>
      <Head title={`Ошибка #${error.id}`} />
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
              {error.severity}
            </Badge>
            <Badge variant={error.status === 'open' ? 'secondary' : 'outline'}>
              {error.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/errors">Назад</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Сообщение</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-foreground whitespace-pre-wrap">
              {error.message || 'Без сообщения'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Подробности</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid gap-2 md:grid-cols-2">
              <Detail label="ID" value={String(error.id)} />
              <Detail label="UUID" value={error.uuid} />
              <Detail label="Код" value={error.code || '—'} />
              <Detail label="Когда" value={formatUtcRu(error.occurredAt || undefined)} />
              <Detail label="Подключение" value={error.source || '—'} />
              <Detail label="Триггер" value={error.trigger || '—'} />
              <Detail label="Окружение" value={error.environment || '—'} />
              <Detail label="Хост" value={error.hostname || '—'} />
              <Detail
                label="Миграция"
                value={
                  error.migrationId ? (
                    <Link href={`/migrations/${error.migrationId}`}>{error.migrationId}</Link>
                  ) : (
                    '—'
                  )
                }
              />
              <Detail
                label="Рун"
                value={error.migrationRunId ? String(error.migrationRunId) : '—'}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stack Trace</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto whitespace-pre-wrap">
              {error.stack || '—'}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Контекст</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto whitespace-pre-wrap">
              {JSON.stringify(error.context || {}, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function Detail(props: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className="text-sm text-foreground">{props.value}</div>
      <Separator className="my-2" />
    </div>
  )
}

function formatUtcRu(input?: string): string {
  if (!input) return '—'
  const d = new Date(input)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

ErrorShow.layout = (page: React.ReactNode) => {
  return <RootLayout title="Ошибка">{page}</RootLayout>
}

export default ErrorShow

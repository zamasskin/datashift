import { Head, Link, usePage } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
// Sidebar indicator kept as-is elsewhere; not used on dashboard page
// import { RunningIndicators } from '~/components/running-indicators'
import { DashboardRunningIndicators } from '~/components/dashboard/running-indicators'
import { useMigrationRuns } from '~/store/migrations'
import { useEffect, useMemo, useState } from 'react'
import { DashboardAreaChart } from '~/components/charts/area-chart'

type HomeProps = {
  counts: { migrations: number; activeMigrations?: number; sources: number; openErrors: number }
  latestMigrations: Array<{ id: number; name: string; isActive: boolean }>
  latestErrors: Array<{
    id: number
    message: string | null
    severity: 'error' | 'warning' | 'info'
    occurredAt?: string | null
  }>
  csrfToken?: string
}

const Home = () => {
  const { runnings } = useMigrationRuns()
  const runningCount = useMemo(() => runnings.length, [runnings])
  const { props } = usePage<HomeProps>()
  const visibleErrorCount = props.latestErrors?.length ?? 0

  return (
    <>
      <Head title="Главная" />
      {/* Статистика */}
      <div className="px-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Миграции"
            value={props.counts?.migrations ?? '—'}
            hint={`Активных: ${
              typeof props.counts?.activeMigrations === 'number'
                ? props.counts.activeMigrations
                : '—'
            }`}
            link={{ href: '/migrations', text: 'Открыть' }}
          />

          <StatCard
            title="Подключения"
            value={props.counts?.sources ?? '—'}
            hint="Всего подключений"
            link={{ href: '/sources', text: 'Открыть' }}
          />

          <StatCard
            title="Ошибки"
            value={props.counts?.openErrors ?? '—'}
            hint="Открытые ошибки"
            link={{ href: '/errors', text: 'Открыть' }}
          />
          <StatCard
            title="Запущено"
            value={runningCount}
            hint="Сейчас выполняется"
            link={{ href: '/tasks', text: 'Открыть' }}
          />
        </div>

        <Separator className="my-2" />

        {/* Аналитика */}
        <SectionHeader title="Аналитика" />
        {(() => {
          const metrics = useMetrics()
          return (
            <DashboardAreaChart
              badge="30 дн."
              hint="Запуски, успешные и отменённые, и ошибки"
              dataRuns={metrics.runs}
              dataErrors={metrics.errors}
              dataSuccess={metrics.runsSuccess}
              dataCanceled={metrics.runsCanceled}
            />
          )
        })()}

        {/* Последние миграции */}
        <SectionHeader
          title="Последние миграции"
          right={<Link href="/migrations">Все миграции</Link>}
        />
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {props.latestMigrations?.length ? (
                  props.latestMigrations.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.id}</TableCell>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>
                        <Badge variant={m.isActive ? 'secondary' : 'outline'}>
                          {m.isActive ? 'активна' : 'выключена'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleRun(m.id, props.csrfToken)}
                          >
                            Запустить
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/migrations/${m.id}`}>Открыть</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="text-sm text-muted-foreground">Нет данных</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Последние ошибки */}
        <SectionHeader
          title="Последние ошибки"
          right={
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{visibleErrorCount}</Badge>
              <Link href="/errors" className="text-sm">
                Все ошибки
              </Link>
            </div>
          }
        />
        <Card>
          <CardContent className="space-y-3">
            {props.latestErrors?.length ? (
              props.latestErrors.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium text-foreground">
                      <Link href={`/errors/${e.id}`}>{e.message || 'Без сообщения'}</Link>
                    </div>
                    {e.occurredAt && (
                      <div className="text-xs text-muted-foreground">
                        {formatUtcRu(e.occurredAt || undefined)}
                      </div>
                    )}
                  </div>
                  <Badge variant={e.severity === 'error' ? 'destructive' : 'secondary'}>
                    {e.severity}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Нет данных</div>
            )}
          </CardContent>
        </Card>

        {/* Быстрые действия */}
        <SectionHeader title="Быстрые действия" />
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/migrations">Создать миграцию</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sources">Подключения</Link>
          </Button>
        </div>

        {/* Запущенные процессы */}
        {runnings.length > 0 && (
          <div className="space-y-3">
            <SectionHeader
              title="Запущено"
              right={<Badge variant="secondary">{runningCount}</Badge>}
            />
            <DashboardRunningIndicators runnings={runnings} />
          </div>
        )}
      </div>
    </>
  )
}

Home.layout = (page: React.ReactNode) => {
  return <RootLayout title="Dataship">{page}</RootLayout>
}

export default Home

function useMetrics() {
  const [runs, setRuns] = useState<Array<{ date: string; value: number }>>([])
  const [errors, setErrors] = useState<Array<{ date: string; value: number }>>([])
  const [runsSuccess, setRunsSuccess] = useState<Array<{ date: string; value: number }>>([])
  const [runsCanceled, setRunsCanceled] = useState<Array<{ date: string; value: number }>>([])
  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch('/metrics/dashboard?days=30', {
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
  }, [])
  return { runs, errors, runsSuccess, runsCanceled }
}

function StatCard({
  title,
  value,
  hint,
  link,
}: {
  title: string
  value: string | number
  hint?: string
  link?: { href: string; text: string }
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        {link && (
          <Button variant="link" asChild>
            <Link href={link.href}>{link.text}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function formatUtcRu(input?: string): string {
  if (!input) return '—'
  const d = new Date(input)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}, ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-2">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      {right}
    </div>
  )
}
async function handleRun(id: number, csrfToken?: string) {
  try {
    const res = await fetch('/migrations/run-by-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      credentials: 'same-origin',
      body: JSON.stringify({ id }),
    })
    if (!res.ok) throw new Error('Failed')
    toast.success(`Запуск миграции #${id} начат`)
  } catch (e) {
    toast.error(`Не удалось запустить миграцию #${id}`)
  }
}

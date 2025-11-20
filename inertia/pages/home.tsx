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
  messages?: any
  locale?: string
}

const Home = () => {
  const { runnings } = useMigrationRuns()
  const runningCount = useMemo(() => runnings.length, [runnings])
  const { props } = usePage<HomeProps>()
  const visibleErrorCount = props.latestErrors?.length ?? 0
  const msg = props.messages || {}
  const locale = String(props.locale || 'ru')

  return (
    <>
      <Head title={msg.title || 'Dashboard'} />
      {/* Статистика */}
      <div className="px-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={msg.stats?.migrationsTitle || 'Migrations'}
            value={props.counts?.migrations ?? '—'}
            hint={msg.stats?.migrationsHintActive || undefined}
            link={{ href: '/migrations', text: msg.stats?.openLink || 'Open' }}
          />

          <StatCard
            title={msg.stats?.sourcesTitle || 'Sources'}
            value={props.counts?.sources ?? '—'}
            hint={msg.stats?.sourcesHintTotal || undefined}
            link={{ href: '/sources', text: msg.stats?.openLink || 'Open' }}
          />

          <StatCard
            title={msg.stats?.errorsTitle || 'Errors'}
            value={props.counts?.openErrors ?? '—'}
            hint={msg.stats?.errorsHintOpen || undefined}
            link={{ href: '/errors', text: msg.stats?.openLink || 'Open' }}
          />
          <StatCard
            title={msg.stats?.runningTitle || 'Running'}
            value={runningCount}
            hint={msg.stats?.runningHintNow || undefined}
            link={{ href: '/tasks', text: msg.stats?.openLink || 'Open' }}
          />
        </div>

        <Separator className="my-2" />

        {/* Аналитика */}
        <SectionHeader title={msg.analytics?.title || 'Analytics'} />
        {(() => {
          const metrics = useMetrics()
          return (
            <DashboardAreaChart
              title={msg.analytics?.title || undefined}
              hint={msg.analytics?.hint || undefined}
              badge={msg.analytics?.badge || undefined}
              dataRuns={metrics.runs}
              dataErrors={metrics.errors}
              dataSuccess={metrics.runsSuccess}
              dataCanceled={metrics.runsCanceled}
            />
          )
        })()}

        {/* Последние миграции */}
        <SectionHeader
          title={msg.migrations?.title || 'Latest migrations'}
          right={<Link href="/migrations">{msg.migrations?.allLink || 'All migrations'}</Link>}
        />
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{msg.migrations?.table?.id || 'ID'}</TableHead>
                  <TableHead>{msg.migrations?.table?.name || 'Name'}</TableHead>
                  <TableHead>{msg.migrations?.table?.status || 'Status'}</TableHead>
                  <TableHead className="text-right">{msg.migrations?.table?.actions || 'Actions'}</TableHead>
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
                          {m.isActive ? msg.migrations?.table?.statusActive || 'active' : msg.migrations?.table?.statusInactive || 'disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleRun(m.id, props.csrfToken)}
                          >
                            {msg.migrations?.table?.run || 'Run'}
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/migrations/${m.id}`}>{msg.migrations?.table?.open || 'Open'}</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="text-sm text-muted-foreground">{msg.migrations?.table?.noData || 'No data'}</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Последние ошибки */}
        <SectionHeader
          title={msg.errors?.title || 'Latest errors'}
          right={
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{visibleErrorCount}</Badge>
              <Link href="/errors" className="text-sm">
                {msg.errors?.allLink || 'All errors'}
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
                      <Link href={`/errors/${e.id}`}>{e.message || msg.errors?.noMessage || 'No message'}</Link>
                    </div>
                    {e.occurredAt && (
                      <div className="text-xs text-muted-foreground">
                        {formatUtc(e.occurredAt || undefined, locale)}
                      </div>
                    )}
                  </div>
                  <Badge variant={e.severity === 'error' ? 'destructive' : 'secondary'}>
                    {e.severity}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">{msg.errors?.noData || 'No data'}</div>
            )}
          </CardContent>
        </Card>

        {/* Быстрые действия */}
        <SectionHeader title={msg.quickActions?.title || 'Quick actions'} />
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/migrations">{msg.quickActions?.createMigration || 'Create migration'}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sources">{msg.quickActions?.sources || 'Sources'}</Link>
          </Button>
        </div>
      </div>
    </>
  )
}

Home.layout = (page: React.ReactNode) => {
  return <RootLayout>{page}</RootLayout>
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

function formatUtc(input?: string, locale: string = 'ru-RU'): string {
  if (!input) return '—'
  const d = new Date(input)
  try {
    const s = d.toLocaleString(locale || 'ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    })
    return s
  } catch {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}, ${pad(
      d.getUTCHours()
    )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  }
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

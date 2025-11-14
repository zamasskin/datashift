import { Head, Link, usePage } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { RunningIndicators } from '~/components/running-indicators'
import { useMigrationRuns } from '~/store/migrations'
import { useMemo } from 'react'

type HomeProps = {
  counts: { migrations: number; sources: number; openErrors: number }
  latestMigrations: Array<{ id: number; name: string; isActive: boolean }>
  latestErrors: Array<{
    id: number
    message: string | null
    severity: 'error' | 'warning' | 'info'
    occurredAt?: string | null
  }>
}

const Home = () => {
  const { runnings } = useMigrationRuns()
  const runningCount = useMemo(() => runnings.length, [runnings])
  const { props } = usePage<HomeProps>()

  return (
    <>
      <Head title="Главная" />
      {/* Статистика */}
      <div className="px-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Источники"
            value={props.counts?.sources ?? '—'}
            hint="Всего источников"
            link={{ href: '/sources', text: 'Открыть' }}
          />
          <StatCard
            title="Миграции"
            value={props.counts?.migrations ?? '—'}
            hint="Всего миграций"
            link={{ href: '/migrations', text: 'Открыть' }}
          />

          <StatCard
            title="Ошибки"
            value={props.counts?.openErrors ?? '—'}
            hint="Открытые ошибки"
            link={{ href: '/errors', text: 'Открыть' }}
          />
        </div>

        {/* Запущенные процессы */}
        <SectionHeader title="Запущено" right={<Badge variant="secondary">{runningCount}</Badge>} />
        <RunningIndicators runnings={runnings} />

        <Separator className="my-2" />

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
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/migrations/${m.id}`}>Открыть</Link>
                        </Button>
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
        <SectionHeader title="Последние ошибки" right={<Link href="/errors">Все ошибки</Link>} />
        <Card>
          <CardContent className="space-y-3">
            {props.latestErrors?.length ? (
              props.latestErrors.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium text-foreground">
                      {e.message || 'Без сообщения'}
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
            <Link href="/sources">Источники</Link>
          </Button>
        </div>
      </div>
    </>
  )
}

Home.layout = (page: React.ReactNode) => {
  return <RootLayout title="Dataship">{page}</RootLayout>
}

export default Home

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

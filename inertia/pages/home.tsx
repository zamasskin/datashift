import { Head, Link } from '@inertiajs/react'
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
import { Skeleton } from '~/components/ui/skeleton'
import { RunningIndicators } from '~/components/running-indicators'
import { useMigrationRuns } from '~/store/migrations'
import { useMemo } from 'react'

const Home = () => {
  const { runnings } = useMigrationRuns()
  const runningCount = useMemo(() => runnings.length, [runnings])

  return (
    <>
      <Head title="Главная" />
      {/* Статистика */}
      <div className="px-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Миграции"
            value="—"
            hint="Всего миграций"
            link={{ href: '/migrations', text: 'Открыть' }}
          />
          <StatCard
            title="Источники"
            value="—"
            hint="Всего источников"
            link={{ href: '/sources', text: 'Открыть' }}
          />

          <StatCard
            title="Ошибки"
            value="—"
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
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="#">Открыть</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Последние ошибки */}
        <SectionHeader title="Последние ошибки" right={<Link href="/errors">Все ошибки</Link>} />
        <Card>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-96" />
                </div>
                <Badge variant="destructive">error</Badge>
              </div>
            ))}
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

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-2">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      {right}
    </div>
  )
}

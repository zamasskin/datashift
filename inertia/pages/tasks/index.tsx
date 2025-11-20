import { Head, usePage, Link } from '@inertiajs/react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { RootLayout } from '~/components/root-layout'
import { Separator } from '~/components/ui/separator'
import { Button } from '~/components/ui/button'
type RunDto = {
  id: number
  status: 'pending' | 'running' | 'success' | 'failed' | 'canceled'
  trigger: 'manual' | 'cron' | 'api' | 'resume'
  createdAt: string | null
  pid: number | null
  migration: { id: number; name: string } | null
}

const Tasks = () => {
  const { props } = usePage<{ runs: RunDto[] }>()
  const runs = props.runs || []
  const statusBadge = (s: RunDto['status']) => {
    switch (s) {
      case 'running':
        return <Badge variant="default">Выполняется</Badge>
      case 'pending':
        return <Badge variant="secondary">В очереди</Badge>
      case 'failed':
        return <Badge variant="destructive">Ошибка</Badge>
      case 'success':
        return <Badge variant="default" className="bg-emerald-600 text-white">Успех</Badge>
      case 'canceled':
        return <Badge variant="outline">Отменено</Badge>
      default:
        return <Badge variant="outline">—</Badge>
    }
  }
  return (
    <>
      <Head title="Задания" />
      <div className="px-4 lg:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Запущенные задания</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/migrations">Все миграции</Link>
          </Button>
        </div>
        <Separator />
        {runs.length === 0 ? (
          <div className="text-muted-foreground">Сейчас нет запущенных заданий.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Миграция</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Запуск</TableHead>
                <TableHead>PID</TableHead>
                <TableHead>Начато</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{run.id}</TableCell>
                  <TableCell>
                    {run.migration ? (
                      <Link href={`/migrations/${run.migration.id}`} className="hover:underline">
                        {run.migration.name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(run.status)}</TableCell>
                  <TableCell className="capitalize">{run.trigger}</TableCell>
                  <TableCell>{run.pid ?? '—'}</TableCell>
                  <TableCell>{run.createdAt ? new Date(run.createdAt).toLocaleString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  )
}

Tasks.layout = (page: React.ReactNode) => {
  return <RootLayout title="Задания">{page}</RootLayout>
}

export default Tasks

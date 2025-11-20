import { Head, Link, usePage } from '@inertiajs/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { RootLayout } from '~/components/root-layout'
import { Separator } from '~/components/ui/separator'
import { Progress } from '~/components/ui/progress'
import { Button } from '~/components/ui/button'
import { useMigrationRuns } from '~/store/migrations'
import { useState } from 'react'
import { StopCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '~/components/ui/dropdown-menu'

type LayoutMessages = {
  pages?: {
    tasks?: {
      title?: string
      h1?: string
      linkMigrations?: string
      empty?: string
      table?: {
        id?: string
        migration?: string
        status?: string
        progress?: string
        trigger?: string
        pid?: string
        startedAt?: string
        actions?: string
      }
      progress?: { showAll?: string; noData?: string }
      badge?: { running?: string; pending?: string; failed?: string; success?: string; canceled?: string }
      action?: { stop?: string }
      migration?: { unnamedPrefix?: string }
      trigger?: { manual?: string; cron?: string; api?: string; resume?: string }
    }
  }
}

const Tasks = () => {
  const { runnings } = useMigrationRuns()
  const { props } = usePage<{ csrfToken?: string; layoutMessages?: LayoutMessages }>()
  const csrfToken = props.csrfToken
  const lm = (props.layoutMessages || {}) as LayoutMessages
  const [stopping, setStopping] = useState<Record<number, boolean>>({})

  const stopRun = async (run: any) => {
    setStopping((prev) => ({ ...prev, [run.id]: true }))
    try {
      await fetch('/migrations/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: JSON.stringify({ migrationId: run.migrationId, trigger: run.trigger }),
        credentials: 'same-origin',
      })
    } finally {
      setStopping((prev) => ({ ...prev, [run.id]: false }))
    }
  }
  const statusBadge = (s: any) => {
    switch (s) {
      case 'running':
        return <Badge variant="default">{lm.pages?.tasks?.badge?.running || 'Выполняется'}</Badge>
      case 'pending':
        return <Badge variant="secondary">{lm.pages?.tasks?.badge?.pending || 'В очереди'}</Badge>
      case 'failed':
        return <Badge variant="destructive">{lm.pages?.tasks?.badge?.failed || 'Ошибка'}</Badge>
      case 'success':
        return (
          <Badge variant="default" className="bg-emerald-600 text-white">
            {lm.pages?.tasks?.badge?.success || 'Успех'}
          </Badge>
        )
      case 'canceled':
        return <Badge variant="outline">{lm.pages?.tasks?.badge?.canceled || 'Отменено'}</Badge>
      default:
        return <Badge variant="outline">—</Badge>
    }
  }
  return (
    <>
      <Head title={lm.pages?.tasks?.title || 'Задания'} />
      <div className="px-4 lg:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{lm.pages?.tasks?.h1 || 'Запущенные задания'}</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/migrations">{lm.pages?.tasks?.linkMigrations || 'Все миграции'}</Link>
          </Button>
        </div>
        <Separator />
        {runnings.length === 0 ? (
          <div className="text-muted-foreground">{lm.pages?.tasks?.empty || 'Сейчас нет запущенных заданий.'}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lm.pages?.tasks?.table?.id || 'ID'}</TableHead>
                <TableHead>{lm.pages?.tasks?.table?.migration || 'Миграция'}</TableHead>
                <TableHead>{lm.pages?.tasks?.table?.status || 'Статус'}</TableHead>
                <TableHead>{lm.pages?.tasks?.table?.progress || 'Прогресс'}</TableHead>
                <TableHead>{lm.pages?.tasks?.table?.trigger || 'Запуск'}</TableHead>
                <TableHead>{lm.pages?.tasks?.table?.pid || 'PID'}</TableHead>
                <TableHead>{lm.pages?.tasks?.table?.startedAt || 'Начато'}</TableHead>
                <TableHead>{lm.pages?.tasks?.table?.actions || 'Действия'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runnings.map((run: any) => (
                <TableRow key={run.id}>
                  <TableCell>{run.id}</TableCell>
                  <TableCell>
                    <Link href={`/migrations/${run.migrationId}`} className="hover:underline">
                      {run?.migrationName ?? run?.migration?.name ?? `${lm.pages?.tasks?.migration?.unnamedPrefix || 'Миграция #'}${run.migrationId}`}
                    </Link>
                  </TableCell>
                  <TableCell>{statusBadge(run.status)}</TableCell>
                  <TableCell>
                    {(() => {
                      const value =
                        Array.isArray(run.progress) && run.progress.length > 0 ? run.progress[0] : 0
                      return (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-2 w-48 cursor-pointer hover:opacity-90"
                              title={lm.pages?.tasks?.progress?.showAll || 'Показать все прогрессы'}
                            >
                              <Progress value={value} />
                              <span className="text-xs text-muted-foreground">{value}%</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64">
                            <DropdownMenuLabel>
                              {run?.migrationName ?? run?.migration?.name ?? `${lm.pages?.tasks?.migration?.unnamedPrefix || 'Миграция #'}${run.migrationId}`}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Array.isArray(run.progress) && run.progress.length > 0 ? (
                              run.progress.map((v: number, i: number) => (
                                <DropdownMenuItem key={i} className="gap-2">
                                  <span className="w-10 shrink-0 text-xs text-muted-foreground">#{i + 1}</span>
                                  <div className="flex items-center gap-2 w-full">
                                    <Progress value={v} />
                                    <span className="text-xs text-muted-foreground">{v}%</span>
                                  </div>
                                </DropdownMenuItem>
                              ))
                            ) : (
                              <DropdownMenuItem disabled>{lm.pages?.tasks?.progress?.noData || 'Нет данных о прогрессе'}</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="capitalize">
                    {lm.pages?.tasks?.trigger?.[String(run.trigger) as 'manual' | 'cron' | 'api' | 'resume'] || String(run.trigger)}
                  </TableCell>
                  <TableCell>{typeof run.pid === 'number' ? run.pid : '—'}</TableCell>
                  <TableCell>
                    {typeof run.createdAt === 'string'
                      ? new Date(run.createdAt).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {run.status === 'running' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopRun(run)}
                        disabled={!!stopping[run.id]}
                      >
                        <StopCircle className="mr-1 h-4 w-4" /> {lm.pages?.tasks?.action?.stop || 'Остановить'}
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {null}
      </div>
    </>
  )
}

const TasksLayout = ({ children }: { children: React.ReactNode }) => {
  const { props } = usePage<{ layoutMessages?: LayoutMessages }>()
  const lm = (props.layoutMessages || {}) as LayoutMessages
  return <RootLayout title={lm.pages?.tasks?.title || 'Задания'}>{children}</RootLayout>
}

Tasks.layout = (page: React.ReactNode) => {
  return <TasksLayout>{page}</TasksLayout>
}

export default Tasks

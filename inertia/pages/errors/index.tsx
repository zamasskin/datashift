import { Head, Link, usePage } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Button } from '~/components/ui/button'

type ErrorItem = {
  id: number
  message: string | null
  severity: 'error' | 'warning' | 'info'
  occurredAt?: string | null
  status: 'open' | 'resolved'
  code: string | null
  migrationId: number | null
  migrationRunId: number | null
}

type ErrorsPageProps = {
  errors: ErrorItem[]
  filters?: { severity: 'error' | 'warning' | 'info' | null; status: 'open' | 'resolved' | null }
}

const ErrorsIndex = () => {
  const { props } = usePage<ErrorsPageProps>()
  const errors = props.errors || []

  return (
    <>
      <Head title="Ошибки" />
      <div className="px-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ошибки</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Сообщение</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Миграция</TableHead>
                  <TableHead>Рун</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.length ? (
                  errors.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.id}</TableCell>
                      <TableCell className="max-w-[480px] truncate" title={e.message || ''}>
                        {e.message || 'Без сообщения'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.severity === 'error' ? 'destructive' : 'secondary'}>
                          {e.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {e.occurredAt ? new Date(e.occurredAt).toLocaleString('ru-RU') : '—'}
                      </TableCell>
                      <TableCell>
                        {e.migrationId ? (
                          <Link href={`/migrations/${e.migrationId}`}>{e.migrationId}</Link>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{e.migrationRunId ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === 'open' ? 'secondary' : 'outline'}>
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/errors/not_found`}>Подробнее</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="text-sm text-muted-foreground">Нет ошибок</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

ErrorsIndex.layout = (page: React.ReactNode) => {
  return <RootLayout title="Ошибки">{page}</RootLayout>
}

export default ErrorsIndex
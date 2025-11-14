import { Head, Link, usePage } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Button } from '~/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '~/components/ui/pagination'

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
  errors: any
  filters?: { severity: 'error' | 'warning' | 'info' | null; status: 'open' | 'resolved' | null }
}

const ErrorsIndex = () => {
  const { props, url } = usePage<ErrorsPageProps>()
  const errorsProp: any = props.errors || []

  const isServerPaginated =
    errorsProp && typeof errorsProp === 'object' && 'meta' in errorsProp && 'data' in errorsProp

  const searchParams = new URLSearchParams(url.split('?')[1] || '')
  const perPageRaw = Number(searchParams.get('perPage') || 10)
  const perPage = isServerPaginated
    ? Number(errorsProp.meta?.perPage ?? 10)
    : Math.max(1, Math.min(perPageRaw, 100))
  const currentPage = isServerPaginated
    ? Number(errorsProp.meta?.currentPage ?? 1)
    : Math.max(1, Number(searchParams.get('page') || 1))
  const allItems: ErrorItem[] = isServerPaginated ? errorsProp.data || [] : errorsProp || []
  const lastPage = isServerPaginated
    ? Number(errorsProp.meta?.lastPage ?? 1)
    : Math.max(1, Math.ceil(allItems.length / perPage))
  const pageData: ErrorItem[] = isServerPaginated
    ? errorsProp.data || []
    : allItems.slice((currentPage - 1) * perPage, (currentPage - 1) * perPage + perPage)

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
                {pageData.length ? (
                  pageData.map((e) => (
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
                      <TableCell>{formatUtcRu(e.occurredAt || undefined)}</TableCell>
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
                          <Link href={`/errors/${e.id}`}>Подробнее</Link>
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

            {lastPage > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={
                          currentPage > 1
                            ? `/errors?page=${currentPage - 1}&perPage=${perPage}`
                            : undefined
                        }
                      />
                    </PaginationItem>

                    {renderPageItems(currentPage, lastPage, perPage)}

                    <PaginationItem>
                      <PaginationNext
                        href={
                          currentPage < lastPage
                            ? `/errors?page=${currentPage + 1}&perPage=${perPage}`
                            : undefined
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
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

function formatUtcRu(input?: string): string {
  if (!input) return '—'
  const d = new Date(input)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

function renderPageItems(current: number, last: number, perPage: number) {
  const items: React.ReactNode[] = []
  const makeLink = (p: number, isActive = false) => (
    <PaginationItem key={p}>
      <PaginationLink href={`/errors?page=${p}&perPage=${perPage}`} isActive={isActive}>
        {p}
      </PaginationLink>
    </PaginationItem>
  )

  if (last <= 5) {
    for (let p = 1; p <= last; p++) items.push(makeLink(p, p === current))
    return items
  }

  items.push(makeLink(1, current === 1))
  items.push(makeLink(2, current === 2))

  items.push(
    <PaginationItem key="ellipsis">
      <PaginationEllipsis />
    </PaginationItem>
  )

  if (last - 1 > 2) items.push(makeLink(last - 1, current === last - 1))
  items.push(makeLink(last, current === last))
  return items
}

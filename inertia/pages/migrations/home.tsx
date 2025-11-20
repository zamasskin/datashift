import { zodResolver } from '@hookform/resolvers/zod'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { RootLayout } from '~/components/root-layout'
import * as z from 'zod'
// Используем shadcn-обёртку для всех компонентов Dialog
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Card, CardContent } from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '~/components/ui/pagination'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import Migration from '#models/migration'

const schemaCreate = z.object({
  name: z.string().trim().min(3, 'Минимум 3 символа').max(64, 'Максимум 64 символа'),
})

type MigrationItem = { id: number; name: string; isActive: boolean; createdAt?: string }

const Migrations = ({ migrations }: { migrations?: ModelPaginatorContract<Migration> }) => {
  const { props, url } = usePage<{ csrfToken?: string; migrations?: MigrationItem[]; messages?: any; pageTitle?: string }>()
  const messages = props.messages?.home

  // Поддержка двух форматов: серверный пагинатор { meta, data } и простой массив
  const isServerPaginated =
    migrations && typeof migrations === 'object' && 'meta' in (migrations as any) && 'data' in (migrations as any)

  const searchParams = new URLSearchParams(url.split('?')[1] || '')
  const perPageRaw = Number(searchParams.get('perPage') || 10)
  const perPage = isServerPaginated ? Number((migrations as any).meta?.perPage ?? 10) : Math.max(1, Math.min(perPageRaw, 100))
  const currentPage = isServerPaginated
    ? Number((migrations as any).meta?.currentPage ?? 1)
    : Math.max(1, Number(searchParams.get('page') || 1))
  const allItems = props.migrations || []
  const lastPage = isServerPaginated
    ? Number((migrations as any).meta?.lastPage ?? 1)
    : Math.max(1, Math.ceil(allItems.length / perPage))
  const pageData: MigrationItem[] = isServerPaginated
    ? (((migrations as any).data as any[]) || [])
    : allItems.slice((currentPage - 1) * perPage, (currentPage - 1) * perPage + perPage)

  const form = useForm<z.infer<typeof schemaCreate>>({
    resolver: zodResolver(schemaCreate),
    defaultValues: { name: '' },
  })

  const onSubmit = (values: z.infer<typeof schemaCreate>) => {
    router.post('/migrations', values, {
      preserveScroll: true,
      onError: (errors: any) => {
        // Бэкенд может вернуть { error: 'Invalid migration name' }
        const msg = errors?.name || errors?.error || messages?.errors?.invalidName || 'Укажите корректное имя'
        form.setError('name', { type: 'server', message: msg })
      },
      // На успехе контроллер делает redirect на /migrations/:id/edit
      onSuccess: () => {
        form.reset()
      },
    })
  }

  return (
    <>
      <Head title={messages?.title || 'Миграции'} />
      <Form {...form}>
        <div className=" px-4 lg:px-6 space-y-4">
          <Dialog>
            {props.csrfToken && <input type="hidden" name="_csrf" value={props.csrfToken} />}
            <DialogTrigger asChild>
              <Button variant="outline">{messages?.add || 'Добавить миграцию'}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{messages?.createTitle || 'Создание миграции'}</DialogTitle>
                <DialogDescription>
                  {messages?.createDescription || 'Введите имя миграции, которое будет использоваться для создания файла миграции в вашем проекте.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{messages?.nameLabel || 'Имя миграции'}</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" onClick={() => form.reset()}>
                      {messages?.cancel || 'Отмена'}
                    </Button>
                  </DialogClose>
                  <Button type="submit">{messages?.submit || 'Добавить'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Список миграций */}
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{messages?.table?.id || 'ID'}</TableHead>
                    <TableHead>{messages?.table?.name || 'Название'}</TableHead>
                    <TableHead>{messages?.table?.activity || 'Активность'}</TableHead>
                    <TableHead>{messages?.table?.created || 'Создано'}</TableHead>
                    <TableHead className="text-right">{messages?.table?.actions || 'Действия'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.length ? (
                    pageData.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.id}</TableCell>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          <Badge variant={m.isActive ? 'secondary' : 'outline'}>
                            {m.isActive ? messages?.table?.statusActive || 'активна' : messages?.table?.statusInactive || 'выключена'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatUtcRu(m.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleRun(m.id, props.csrfToken, messages)}
                            >
                              {messages?.table?.run || 'Запустить'}
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/migrations/${m.id}`}>{messages?.table?.open || 'Открыть'}</Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(m.id, messages)}
                            >
                              {messages?.table?.delete || 'Удалить'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="text-sm text-muted-foreground">{messages?.table?.noData || 'Нет миграций'}</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Пагинация */}
              {lastPage > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      {/* Previous */}
                      <PaginationItem>
                        <PaginationPrevious
                          href={
                            currentPage > 1
                              ? `/migrations?page=${currentPage - 1}&perPage=${perPage}`
                              : undefined
                          }
                        />
                      </PaginationItem>

                      {/* Page numbers with ellipsis */}
                      {renderPageItems(currentPage, lastPage, perPage)}

                      {/* Next */}
                      <PaginationItem>
                        <PaginationNext
                          href={
                            currentPage < lastPage
                              ? `/migrations?page=${currentPage + 1}&perPage=${perPage}`
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
      </Form>
    </>
  )
}

Migrations.layout = (page: React.ReactNode) => {
  // Avoid hooks in layout: RootLayout reads page props itself to compute title
  return <RootLayout>{page}</RootLayout>
}

export default Migrations

function formatUtcRu(input?: string): string {
  if (!input) return '—'
  const d = new Date(input)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

function handleDelete(id: number, messages?: any) {
  const confirmText = (messages?.confirmDelete || `Удалить миграцию #{id}?`).replace('{id}', String(id))
  if (!confirm(confirmText)) return
  let handled = false
  router.delete('/migrations', {
    data: { ids: [id], redirectTo: '/migrations' },
    preserveScroll: true,
    onSuccess: () => {
      handled = true
      toast.success(messages?.toast?.deleted || 'Миграция удалена')
    },
    onError: () => {
      handled = true
      toast.error(messages?.toast?.deleteFailed || 'Не удалось удалить миграцию')
    },
    // Сервер теперь возвращает редирект; на всякий случай — fallback
    onFinish: () => {
      if (!handled) toast.success(messages?.toast?.deleted || 'Миграция удалена')
      router.visit('/migrations')
    },
  })
}

async function handleRun(id: number, csrfToken?: string, messages?: any) {
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
      toast.success((messages?.toast?.runStarted || 'Запуск миграции #{id} начат').replace('{id}', String(id)))
  } catch (e) {
      toast.error((messages?.toast?.runFailed || 'Не удалось запустить миграцию #{id}').replace('{id}', String(id)))
  }
}

function renderPageItems(current: number, last: number, perPage: number) {
  const items: React.ReactNode[] = []
  const makeLink = (p: number, isActive = false) => (
    <PaginationItem key={p}>
      <PaginationLink href={`/migrations?page=${p}&perPage=${perPage}`} isActive={isActive}>
        {p}
      </PaginationLink>
    </PaginationItem>
  )

  // Small number of pages: show all
  if (last <= 5) {
    for (let p = 1; p <= last; p++) items.push(makeLink(p, p === current))
    return items
  }

  // Desired layout: 1, 2, …, last-1, last
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

// Удалены хелперы, чтение страницы/лимита берём из Inertia router URL

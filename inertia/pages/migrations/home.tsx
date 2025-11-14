import { zodResolver } from '@hookform/resolvers/zod'
import { Head, Link, router, usePage } from '@inertiajs/react'
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

const schemaCreate = z.object({
  name: z.string().trim().min(3, 'Минимум 3 символа').max(64, 'Максимум 64 символа'),
})

type MigrationItem = { id: number; name: string; isActive: boolean; createdAt?: string }

const Migrations = () => {
  const { props } = usePage<{ csrfToken?: string; migrations?: MigrationItem[] }>()

  const form = useForm<z.infer<typeof schemaCreate>>({
    resolver: zodResolver(schemaCreate),
    defaultValues: { name: '' },
  })

  const onSubmit = (values: z.infer<typeof schemaCreate>) => {
    router.post('/migrations', values, {
      preserveScroll: true,
      onError: (errors: any) => {
        // Бэкенд может вернуть { error: 'Invalid migration name' }
        const msg = errors?.name || errors?.error || 'Укажите корректное имя'
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
      <Head title="Миграции" />
      <Form {...form}>
        <div className=" px-4 lg:px-6 space-y-4">
          <Dialog>
            {props.csrfToken && <input type="hidden" name="_csrf" value={props.csrfToken} />}
            <DialogTrigger asChild>
              <Button variant="outline">Добавить миграцию</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Создание миграции</DialogTitle>
                <DialogDescription>
                  Введите имя миграции, которое будет использоваться для создания файла миграции в
                  вашем проекте.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя миграции</FormLabel>
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
                      Отмена
                    </Button>
                  </DialogClose>
                  <Button type="submit">Добавить</Button>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Активность</TableHead>
                    <TableHead>Создано</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPageData(props.migrations).length ? (
                    getPageData(props.migrations).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.id}</TableCell>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          <Badge variant={m.isActive ? 'secondary' : 'outline'}>
                            {m.isActive ? 'активна' : 'выключена'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString('ru-RU') : '—'}
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
                      <TableCell colSpan={5}>
                        <div className="text-sm text-muted-foreground">Нет миграций</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Пагинация */}
              {getLastPage(props.migrations) > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        {/* Previous */}
                        <PaginationItem>
                          <PaginationPrevious
                            href={
                              getCurrentPage() > 1
                                ? `/migrations?page=${getCurrentPage() - 1}&perPage=${getPerPage()}`
                                : undefined
                            }
                          />
                        </PaginationItem>

                        {/* Page numbers with ellipsis */}
                        {renderPageItems(getCurrentPage(), getLastPage(props.migrations), getPerPage())}

                        {/* Next */}
                        <PaginationItem>
                          <PaginationNext
                            href={
                              getCurrentPage() < getLastPage(props.migrations)
                                ? `/migrations?page=${getCurrentPage() + 1}&perPage=${getPerPage()}`
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
  return <RootLayout title="Миграции">{page}</RootLayout>
}

export default Migrations

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

function getPerPage(): number {
  if (typeof window === 'undefined') return 10
  const url = new URL(window.location.href)
  const perPage = Number(url.searchParams.get('perPage') || 10)
  return Math.max(1, Math.min(perPage, 100))
}

function getCurrentPage(): number {
  if (typeof window === 'undefined') return 1
  const url = new URL(window.location.href)
  const page = Number(url.searchParams.get('page') || 1)
  return Math.max(1, page)
}

function getLastPage(list?: MigrationItem[]): number {
  const items = list || []
  const perPage = getPerPage()
  return Math.max(1, Math.ceil(items.length / perPage))
}

function getPageData(list?: MigrationItem[]): MigrationItem[] {
  const items = list || []
  const perPage = getPerPage()
  const current = getCurrentPage()
  const start = (current - 1) * perPage
  return items.slice(start, start + perPage)
}

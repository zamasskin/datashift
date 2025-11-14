import { zodResolver } from '@hookform/resolvers/zod'
import { Head, router, usePage } from '@inertiajs/react'
import { useForm } from 'react-hook-form'
import { RootLayout } from '~/components/root-layout'
import * as z from 'zod'
import { Dialog, DialogTrigger } from '@radix-ui/react-dialog'
import { Button } from '~/components/ui/button'
import {
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

const schemaCreate = z.object({
  name: z.string().trim().min(3, 'Минимум 3 символа').max(64, 'Максимум 64 символа'),
})

const Migrations = () => {
  const { props } = usePage<{ csrfToken?: string }>()
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
                  <Button type="submit" onClick={() => form.handleSubmit(onSubmit)}>
                    Добавить
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Form>
    </>
  )
}

Migrations.layout = (page: React.ReactNode) => {
  return <RootLayout title="Миграции">{page}</RootLayout>
}

export default Migrations

import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { router, usePage } from '@inertiajs/react'
import { Button } from '~/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { AvatarImage, Avatar } from '~/components/ui/avatar'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { SqlDataSourceFormConfig, SqliteDataSourceFormConfig } from './inputs-form-config'
import { schemaInsert, types, typesIcon } from './config'

export function CreateSource() {
  const [open, setOpen] = useState(false)
  const { props } = usePage<{ csrfToken: string }>()

  const form = useForm<z.infer<typeof schemaInsert>>({
    resolver: zodResolver(schemaInsert),
    defaultValues: {
      name: '',
      type: 'mysql',
    },
  })

  const onSubmit = async (values: z.infer<typeof schemaInsert>) => {
    router.post('/sources', values, {
      preserveScroll: true,
      onError: (errors) => {
        Object.entries(errors || {}).forEach(([field, message]) => {
          const msg = Array.isArray(message) ? message[0] : (message as string)
          form.setError(field as any, { type: 'server', message: msg })
        })
      },
      onSuccess: () => {
        setOpen(false)
        form.reset()
      },
    })
  }

  return (
    <Form {...form}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Создать</span>
          </Button>
        </SheetTrigger>
        <SheetContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {props.csrfToken && <input type="hidden" name="_csrf" value={props.csrfToken} />}
            <SheetHeader>
              <SheetTitle>Новый источник данных</SheetTitle>
              <SheetDescription>
                {/* ... existing code ... */}
                <div className="flex flex-col gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Наименование</FormLabel>
                        <FormControl>
                          <Input placeholder="name" {...field} />
                        </FormControl>
                        <FormDescription>От 3 до 64 символов.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Исправлено: name="type" и Select с value/onValueChange */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип источника" />
                            </SelectTrigger>
                            <SelectContent>
                              {types.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <Avatar className="h-6 w-6 rounded-lg grayscale">
                                    <AvatarImage src={typesIcon[type.value]} />
                                  </Avatar>
                                  {type.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <RenderConfig form={form} />
                </div>
              </SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <Button type="submit">Создать</Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </Form>
  )
}

function RenderConfig({ form }: { form: UseFormReturn<z.infer<typeof schemaInsert>> }) {
  const selectedType = form.watch('type')
  switch (selectedType) {
    case 'mysql':
    case 'postgres':
      return <SqlDataSourceFormConfig form={form} />
    case 'sqlite':
      return <SqliteDataSourceFormConfig form={form} />
  }
  return null
}

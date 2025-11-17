import { useEffect } from 'react'
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
import DataSource from '#models/data_source'
import { SqlDataSourceFormConfig, SqliteDataSourceFormConfig } from './inputs-form-config'
import { schemaInsert, types, typesIcon } from './config'

export function EditSource({
  open,
  onOpenChange,
  source,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: Pick<DataSource, 'id' | 'name' | 'type' | 'config'> | null
}) {
  const { props } = usePage<{ csrfToken: string }>()

  const form = useForm<z.infer<typeof schemaInsert>>({
    resolver: zodResolver(schemaInsert),
    defaultValues: {
      name: '',
      type: 'mysql',
    },
  })

  useEffect(() => {
    if (!source) return
    const defaults: any = {
      name: source.name || '',
      type: (source.type as any) || 'mysql',
      config: { ...(source.config || {}) },
    }
    // Для SQLite при выводе в форме убираем префикс "data/" или "./data/"
    if (defaults.type === 'sqlite' && defaults.config && typeof defaults.config.file === 'string') {
      let f: string = defaults.config.file
      if (f.startsWith('./data/')) {
        f = f.replace('./', '')
      }
      if (f.startsWith('data/')) {
        f = f.slice('data/'.length)
      }
      defaults.config.file = f
    }
    form.reset(defaults)
  }, [source])

  const onSubmit = async (values: z.infer<typeof schemaInsert>) => {
    if (!source) return
    router.put(
      `/sources`,
      { ...values, id: source.id },
      {
        preserveScroll: true,
        preserveState: true,
        onError: (errors) => {
          // Keep sheet open and display field errors on 422
          onOpenChange(true)
          Object.entries(errors || {}).forEach(([field, message]) => {
            const msg = Array.isArray(message) ? message[0] : (message as string)
            form.setError(field as any, { type: 'server', message: msg })
          })
        },
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Form {...form}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {props.csrfToken && <input type="hidden" name="_csrf" value={props.csrfToken} />}
            <SheetHeader>
              <SheetTitle>Редактировать источник данных</SheetTitle>
              <SheetDescription>
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
              <Button type="submit">Сохранить</Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

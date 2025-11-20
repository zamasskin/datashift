import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { schemaInsert } from './config'
import * as z from 'zod'
import { usePage } from '@inertiajs/react'

export function SqlDataSourceFormConfig({
  form,
}: {
  form: UseFormReturn<z.infer<typeof schemaInsert>>
}) {
  const { props } = usePage<{ sourcesMessages?: any }>()
  const m = props.sourcesMessages || {}
  const selectedType = form.watch('type')
  const port = selectedType == 'mysql' ? 3306 : 5432
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <FormField
            control={form.control}
            name="config.host"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{m.form?.sqlHostLabel || 'Хост'}</FormLabel>
                <FormControl>
                  <Input placeholder={m.form?.sqlHostPlaceholder || 'localhost'} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <FormField
            control={form.control}
            name="config.port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{m.form?.sqlPortLabel || 'Порт'}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder={port.toString()}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <FormField
        control={form.control}
        name="config.username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{m.form?.sqlUsernameLabel || 'Имя пользователя'}</FormLabel>
            <FormControl>
              <Input placeholder="" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{m.form?.sqlPasswordLabel || 'Пароль'}</FormLabel>
            <FormControl>
              <Input type="password" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.database"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{m.form?.sqlDatabaseLabel || 'База данных'}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

export function SqliteDataSourceFormConfig({
  form,
}: {
  form: UseFormReturn<z.infer<typeof schemaInsert>>
}) {
  const { props } = usePage<{ sourcesMessages?: any }>()
  const m = props.sourcesMessages || {}
  return (
    <>
      <FormField
        control={form.control}
        name="config.file"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{m.form?.sqliteFileLabel || 'Путь к файлу'}</FormLabel>
            <FormControl>
              <Input placeholder={m.form?.sqliteFilePlaceholder || 'db.sqlite'} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

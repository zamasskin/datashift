import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { schemaInsert } from './config'
import * as z from 'zod'

export function SqlDataSourceFormConfig({
  form,
}: {
  form: UseFormReturn<z.infer<typeof schemaInsert>>
}) {
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
                <FormLabel>Хост</FormLabel>
                <FormControl>
                  <Input placeholder="localhost" {...field} />
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
                <FormLabel>Порт</FormLabel>
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
            <FormLabel>Имя пользователя</FormLabel>
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
            <FormLabel>Пароль</FormLabel>
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
            <FormLabel>База данных</FormLabel>
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
  return (
    <>
      <FormField
        control={form.control}
        name="config.file"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Путь к файлу</FormLabel>
            <FormControl>
              <Input placeholder="db.sqlite" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

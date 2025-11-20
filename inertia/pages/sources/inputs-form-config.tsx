import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { schemaInsert } from './config'
import * as z from 'zod'
import { useI18n } from '~/hooks/useI18nLocal'

export function SqlDataSourceFormConfig({
  form,
}: {
  form: UseFormReturn<z.infer<typeof schemaInsert>>
}) {
  const { t } = useI18n()
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
                <FormLabel>{t('sources.form.sqlHostLabel', 'Хост')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('sources.form.sqlHostPlaceholder', 'localhost')}
                    {...field}
                  />
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
                <FormLabel>{t('sources.form.sqlPortLabel', 'Порт')}</FormLabel>
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
            <FormLabel>{t('sources.form.sqlUsernameLabel', 'Имя пользователя')}</FormLabel>
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
            <FormLabel>{t('sources.form.sqlPasswordLabel', 'Пароль')}</FormLabel>
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
            <FormLabel>{t('sources.form.sqlDatabaseLabel', 'База данных')}</FormLabel>
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
  const { t } = useI18n()
  return (
    <>
      <FormField
        control={form.control}
        name="config.file"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('sources.form.sqliteFileLabel', 'Путь к файлу')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('sources.form.sqliteFilePlaceholder', 'db.sqlite')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

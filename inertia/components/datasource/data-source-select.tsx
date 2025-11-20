import { usePage } from '@inertiajs/react'
import { Field, FieldLabel } from '../ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import DataSource from '#models/data_source'
import { useI18n } from '~/hooks/useI18nLocal'

export type DataSourceSelectProps = {
  value?: number
  onChange?: (value: number) => void
}

export function DataSourceSelect(props: DataSourceSelectProps) {
  const { t } = useI18n()
  const value = props.value ? props.value.toString() : undefined
  const { props: pageProps } = usePage<{ dataSources: DataSource[] }>()
  return (
    <Field>
      <FieldLabel>{t('sources.form.sourceLabel', 'Подключение')}</FieldLabel>
      <Select value={value} onValueChange={(v) => props.onChange?.(Number(v))}>
        <SelectTrigger>
          <SelectValue placeholder={t('sources.form.sourcePlaceholder', 'Выберите подключение')} />
        </SelectTrigger>
        <SelectContent>
          {pageProps.dataSources.map((source) => (
            <SelectItem key={source.id} value={source.id.toString()}>
              {source.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

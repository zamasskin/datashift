import DataSource from '#models/data_source'
import { usePage } from '@inertiajs/react'
import { Badge } from '../ui/badge'
import { useI18n } from '~/hooks/useI18nLocal'

export function DataSourcePreview(props: { dataSourceId: number }) {
  const { props: pageProps } = usePage<{ dataSources: DataSource[] }>()
  const { t } = useI18n()
  const dataSource = pageProps.dataSources.find((ds) => ds.id === props.dataSourceId)
  if (!dataSource) {
    return (
      <div className="flex gap-4">
        <p>{t('sources.form.sourceLabel', 'Подключение')}:</p>
        <Badge>{t('sources.form.sourcePlaceholder', 'Не выбрано')}</Badge>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      <p>{t('sources.form.sourceLabel', 'Подключение')}:</p>
      <Badge>{dataSource.name}</Badge>
    </div>
  )
}

import DataSource from '#models/data_source'
import { usePage } from '@inertiajs/react'
import { Badge } from '../ui/badge'

export function DataSourcePreview(props: { dataSourceId: number }) {
  const { props: pageProps } = usePage<{ dataSources: DataSource[] }>()
  const dataSource = pageProps.dataSources.find((ds) => ds.id === props.dataSourceId)
  if (!dataSource) {
    return (
      <div className="flex gap-4">
        <p>Источник:</p>
        <Badge>Не выбрано</Badge>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      <p>Источник:</p>
      <Badge>{dataSource.name}</Badge>
    </div>
  )
}

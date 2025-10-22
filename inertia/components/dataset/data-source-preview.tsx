import DataSource from '#models/data_source'
import { usePage } from '@inertiajs/react'

export function DataSourcePreview(props: { dataSourceId: number }) {
  const { props: pageProps } = usePage<{ dataSources: DataSource[] }>()
  const dataSource = pageProps.dataSources.find((ds) => ds.id === props.dataSourceId)
  if (!dataSource) {
    return <span className="font-mono">Не выбрано</span>
  }

  return <span className="font-mono">{dataSource.name}</span>
}

import { useEffect, useMemo, useState } from 'react'
import * as _ from 'lodash'
import { usePage } from '@inertiajs/react'
import { Dataset, DatasetItem } from '~/interfaces/datasets'
import { buildQuery } from '~/helpers/build-query'

export function useData(
  datasetsProps: Dataset[] = [],
  columnsProps: Record<string, string[]> = {}
) {
  const { props } = usePage<{ csrfToken: string }>()

  const [datasets, setDatasets] = useState<Dataset[]>(datasetsProps)
  const [columns, setColumns] = useState<Record<string, string[]>>(columnsProps)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadings, setLoadings] = useState<Record<string, boolean>>({})

  const data = useMemo(() => {
    return datasets.map((dataset, i, arr) => ({
      ...dataset,
      columns: arr
        .slice(0, i)
        .map((d) => ({ name: d.name, columns: columns[d.name] || [] }))
        .map((d) => `${d.name}.${d.columns.join('.')}`)
        .flat(),
      error: errors[dataset.name] || '',
      isLoading: loadings[dataset.name] || false,
    }))
  }, [datasets, errors, loadings, columns])

  const addDataset = (type: Dataset['type'], name: string) => {
    const dataset = defaultValues[type]
    setDatasets([...datasets, { ...dataset, name }])
  }

  const removeDataset = (name: string) => {
    setDatasets(datasets.filter((d) => d.name !== name))
  }

  useEffect(() => {
    // Тут нужно проверить все запросы и показать результирующую таблицу
  }, [datasets])

  const applyDataset = async (name: Dataset['name'], value: DatasetItem) => {
    const dataset = datasets.find((d) => d.name === name)
    setErrors({ ...errors, [name]: '' })
    setLoadings({ ...loadings, [name]: false })

    if (!dataset) return

    try {
      if (value.type === 'sql') {
        setLoadings({ ...loadings, [name]: true })
        const request = await fetch('/datasets/test-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': props.csrfToken },
          body: JSON.stringify({
            sql: value.query,
            dataSourceId: value.datasourceId,
            variables: value.variables,
          }),
        })
        const responseData = await request.json()
        if (responseData.error) {
          setErrors({ ...errors, [name]: responseData.error })
          return
        }

        const { columns: columnsData } = responseData
        setColumns({ ...columns, [name]: columnsData || [] })
        setDatasets(datasets.map((d) => (d.name === name ? { ...d, ...value } : d)))
      }

      if (value.type === 'buildQuery') {
        setLoadings({ ...loadings, [name]: true })
        const { query, variables } = buildQuery(value)
        setLoadings({ ...loadings, [name]: true })
        const request = await fetch('/datasets/test-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': props.csrfToken },
          body: JSON.stringify({ sql: query, dataSourceId: value.datasourceId, variables }),
        })
        const responseData = await request.json()
        if (responseData.error) {
          setErrors({ ...errors, [name]: responseData.error })
          return
        }

        const { columns: columnsData } = responseData
        setColumns({ ...columns, [name]: columnsData || [] })
        setDatasets(datasets.map((d) => (d.name === name ? { ...d, ...value } : d)))
      }
    } catch (err) {
      setErrors({ ...errors, [name]: String(err) })
    }

    // setDatasets(datasets.map((d) => (d.name === name ? { ...d, ...dataset } : d)))
  }

  return { data, addDataset, removeDataset, applyDataset }
}

const defaultValues: Record<Dataset['type'], DatasetItem> = {
  sql: {
    type: 'sql',
    query: '',
    datasourceId: 0,
    variables: [],
  },
  buildQuery: {
    type: 'buildQuery',
    datasourceId: 0,
    table: '',
    variables: [],
    columns: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    having: [],
    joins: [],
  },
}

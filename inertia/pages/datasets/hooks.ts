import { useEffect, useMemo, useState } from 'react'
import * as _ from 'lodash'
import { usePage } from '@inertiajs/react'

type SqlDataset = {
  type: 'sql'
  query: string
  datasourceId: number
  variables: string[]
}

type BuildSqlDataset = {
  type: 'buildQuery'
  datasourceId: number
  variables: string[]
  table: string
  columns?: string[]
  filters?: {
    column: string
    operator: '=' | '!=' | '>' | '<' | '>=' | '<='
    value: string
  }[]
  groupBy?: string[]
  orderBy?: {
    column: string
    direction: 'asc' | 'desc'
  }[]
  having?: {
    column: string
    operator: '=' | '!=' | '>' | '<' | '>=' | '<='
    value: string
  }[]
  joins?: {
    type: 'join' | 'leftJoin' | 'rightJoin' | 'innerJoin'
    table: string
    on: {
      left: string
      right: string
      operator?: 'AND' | 'OR'
    }[]
  }[]
}

type DatasetItem = SqlDataset | BuildSqlDataset

type Dataset = DatasetItem & {
  name: string
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

export function buildQuery(payload: Omit<BuildSqlDataset, 'type'>): {
  query: string
  variables: string[]
} {
  const {
    table,
    columns = [],
    filters = [],
    groupBy = [],
    orderBy = [],
    having = [],
    joins = [],
    variables = [],
  } = payload

  const joinTypeMap: Record<'join' | 'leftJoin' | 'rightJoin' | 'innerJoin', string> = {
    join: 'JOIN',
    leftJoin: 'LEFT JOIN',
    rightJoin: 'RIGHT JOIN',
    innerJoin: 'INNER JOIN',
  }

  const escapeValue = (v: string) => {
    const isNumeric = /^-?\d+(\.\d+)?$/.test(v)
    return isNumeric ? v : `'${v.replace(/'/g, "''")}'`
  }

  const parts: string[] = []

  // SELECT
  parts.push(`SELECT ${columns.length ? columns.join(', ') : '*'}`)

  // FROM
  parts.push(`FROM ${table}`)

  // JOINs
  for (const j of joins) {
    const jt = joinTypeMap[j.type] || 'JOIN'
    const onClause =
      j.on
        .map((c, idx) =>
          idx === 0 ? `${c.left} = ${c.right}` : `${c.operator || 'AND'} ${c.left} = ${c.right}`
        )
        .join(' ') || '1=1'
    parts.push(`${jt} ${j.table} ON ${onClause}`)
  }

  // WHERE
  if (filters.length) {
    const where = filters
      .map((f) => `${f.column} ${f.operator} ${escapeValue(f.value)}`)
      .join(' AND ')
    parts.push(`WHERE ${where}`)
  }

  // GROUP BY
  if (groupBy.length) {
    parts.push(`GROUP BY ${groupBy.join(', ')}`)
  }

  // HAVING
  if (having.length) {
    const havingClause = having
      .map((h) => `${h.column} ${h.operator} ${escapeValue(h.value)}`)
      .join(' AND ')
    parts.push(`HAVING ${havingClause}`)
  }

  // ORDER BY
  if (orderBy.length) {
    const order = orderBy.map((o) => `${o.column} ${o.direction.toUpperCase()}`).join(', ')
    parts.push(`ORDER BY ${order}`)
  }

  const sql = parts.join(' ')
  return { query: sql, variables }
}

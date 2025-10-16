import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { SqlQuery } from '~/components/example/sql-query'
import { TableQueryBuilder } from '~/components/example/table-query-builder'
import { DataEnrichment } from '~/components/example/data-enrichment'

const Demo = () => {
  const dataSources = [
    { id: 1, name: 'PostgreSQL — prod' },
    { id: 2, name: 'MySQL — staging' },
    { id: 3, name: 'SQLite — local file' },
  ]

  const tables = ['users', 'orders', 'products', 'order_items']

  const [sqlResult, setSqlResult] = useState<{
    rows: Array<Record<string, any>>
    columns?: string[]
    loading?: boolean
  }>({ rows: [] })
  const [tableResult, setTableResult] = useState<{
    rows: Array<Record<string, any>>
    columns?: string[]
    loading?: boolean
  }>({ rows: [] })
  const [enrichResult, setEnrichResult] = useState<{
    rows: Array<Record<string, any>>
    columns?: string[]
    loading?: boolean
  }>({ rows: [] })
  const [showSql, setShowSql] = useState(true)
  const [showTable, setShowTable] = useState(true)
  const [showEnrich, setShowEnrich] = useState(true)

  const onSqlApply = (payload: any) => {
    console.log('SQL Apply:', payload)
    setSqlResult({ rows: [], loading: true })
    // Имитация выполнения запроса
    setTimeout(() => {
      setSqlResult({
        loading: false,
        rows: [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
          { id: 3, name: 'Charlie', email: 'charlie@example.com' },
        ],
      })
    }, 600)
  }

  const onTableApply = (payload: any) => {
    console.log('Table Apply:', payload)
    setTableResult({ rows: [], loading: true })
    setTimeout(() => {
      setTableResult({
        loading: false,
        rows: [
          { order_id: 101, product: 'Keyboard', amount: 2, price: 49.9 },
          { order_id: 102, product: 'Mouse', amount: 1, price: 19.99 },
          { order_id: 103, product: 'Monitor', amount: 3, price: 199.0 },
        ],
      })
    }, 700)
  }

  const onEnrichApply = (payload: {
    mode: 'compose' | 'script'
    newColumnName: string
    selectedColumns?: string[]
    joiner?: string
    script?: string
  }) => {
    console.log('Enrich Apply:', payload)
    const sourceRows = sqlResult.rows?.length ? sqlResult.rows : tableResult.rows
    const sourceColumns = sqlResult.rows?.length ? sqlResult.columns : tableResult.columns
    setEnrichResult({ rows: [], columns: sourceColumns, loading: true })
    setTimeout(() => {
      try {
        const rows = (sourceRows || []).map((row) => {
          let value: any = null
          if (payload.mode === 'compose') {
            const cols =
              (payload.selectedColumns?.length ? payload.selectedColumns : sourceColumns) || []
            const joiner = typeof payload.joiner === 'string' ? payload.joiner : ' '
            value = cols.map((c) => String(row?.[c] ?? '')).join(joiner)
          } else {
            const expr = payload.script?.trim() || 'null'
            const fn = new Function('row', 'cols', `return (${expr});`)
            value = fn(row, sourceColumns || [])
          }
          return { ...row, [payload.newColumnName || 'new_column']: value }
        })
        const nextColumns = (() => {
          const base =
            sourceColumns && sourceColumns.length
              ? sourceColumns
              : (() => {
                  const set = new Set<string>()
                  ;(sourceRows || []).forEach((r) =>
                    Object.keys(r || {}).forEach((k) => set.add(k))
                  )
                  return Array.from(set)
                })()
          const newCol = payload.newColumnName || 'new_column'
          return Array.from(new Set([...(base || []), newCol]))
        })()
        setEnrichResult({ rows, columns: nextColumns, loading: false })
      } catch (e) {
        console.error('Enrichment error:', e)
        setEnrichResult({ rows: [], columns: sourceColumns, loading: false })
      }
    }, 300)
  }

  return (
    <>
      <Head title="Компоненты запроса" />
      <div className="container mx-auto max-w-5xl space-y-6 p-4">
        {showSql && (
          <>
            <h1 className="text-xl font-semibold">SQL запрос</h1>
            <SqlQuery
              dataSources={dataSources}
              initialSql={''}
              onApply={onSqlApply}
              result={sqlResult}
              onRemove={() => setShowSql(false)}
            />
          </>
        )}

        {showTable && (
          <>
            <h1 className="text-xl font-semibold">Выбор таблиц, фильтры, связи и группировка</h1>
            <TableQueryBuilder
              dataSources={dataSources}
              tables={tables}
              onApply={onTableApply}
              result={tableResult}
              onRemove={() => setShowTable(false)}
            />
          </>
        )}

        {showEnrich && (
          <>
            <h1 className="text-xl font-semibold">Обогащение данных</h1>
            <DataEnrichment
              sourceRows={sqlResult.rows?.length ? sqlResult.rows : tableResult.rows}
              sourceColumns={sqlResult.rows?.length ? sqlResult.columns : tableResult.columns}
              result={enrichResult}
              onApply={onEnrichApply}
              onRemove={() => setShowEnrich(false)}
            />
          </>
        )}
      </div>
    </>
  )
}

export default Demo

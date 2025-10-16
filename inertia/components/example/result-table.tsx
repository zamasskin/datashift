import React from 'react'
import { cn } from '~/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'

export type ResultTableProps = {
  rows: Array<Record<string, any>>
  columns?: string[]
  loading?: boolean
  className?: string
}

function formatCell(value: any) {
  if (value === null || typeof value === 'undefined') return '—'
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export function ResultTable({ rows, columns, loading, className }: ResultTableProps) {
  const cols = React.useMemo(() => {
    if (columns?.length) return columns
    const set = new Set<string>()
    rows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k)))
    const computed = Array.from(set)
    return computed.length ? computed : []
  }, [rows, columns])

  const colCount = cols.length || 1

  return (
    <div className={cn('relative overflow-hidden rounded-lg border', className)}>
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            {cols.length ? (
              cols.map((c) => <TableHead key={c}>{c}</TableHead>)
            ) : (
              <TableHead>Результат</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={colCount} className="h-24 text-center">
                Загрузка...
              </TableCell>
            </TableRow>
          ) : rows && rows.length ? (
            rows.map((row, i) => (
              <TableRow key={i}>
                {cols.length ? (
                  cols.map((c) => <TableCell key={c}>{formatCell(row?.[c])}</TableCell>)
                ) : (
                  <TableCell>{formatCell(row)}</TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={colCount} className="h-24 text-center">
                Нет данных.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
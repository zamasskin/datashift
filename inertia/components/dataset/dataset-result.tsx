import { Card, CardAction, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ResultTable } from '~/components/example/result-table'
import { Spinner } from '~/components/ui/spinner'
import { Button } from '../ui/button'
import { RefreshCcw } from 'lucide-react'

export type DatasetOverallResult = {
  rows: Array<Record<string, any>>
  columns?: string[]
  loading?: boolean
  error?: string
}

export function DatasetResult({
  result,
  title = 'Итоговый результат',
  className,
  onReload,
}: {
  result?: DatasetOverallResult
  title?: string
  className?: string
  onReload?: () => void
}) {
  const rowCount = result?.rows?.length ?? 0
  const colCount =
    result?.columns?.length ?? (result?.rows?.[0] ? Object.keys(result.rows[0]).length : 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <div className="flex gap-2 items-center">
            <div className="text-muted-foreground text-sm">
              {rowCount} строк; {colCount || 0} колонок
            </div>
            <Button size="icon" variant="ghost" type="button" onClick={onReload}>
              <RefreshCcw />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="p-4 space-y-2 relative">
        {result?.error ? <div className="text-destructive text-sm">{result.error}</div> : null}

        {result?.loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Spinner />
          </div>
        )}

        <div className={result?.loading ? 'pointer-events-none opacity-60' : ''}>
          <ResultTable
            rows={result?.rows ?? []}
            columns={result?.columns}
            loading={result?.loading}
          />
        </div>
      </CardContent>
    </Card>
  )
}

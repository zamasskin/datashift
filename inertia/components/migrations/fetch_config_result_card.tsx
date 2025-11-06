import { FetchConfigResult } from '#interfaces/fetchсonfigs'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Spinner } from '../ui/spinner'

export type FetchConfigResultProps = {
  result?: FetchConfigResult
  isLoading?: boolean
  error?: string
}

export function FetchConfigResultCard({ result, isLoading, error }: FetchConfigResultProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle className="text-destructive">Ошибка</AlertTitle>
        <AlertDescription className="text-destructive">
          <pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto">{error}</pre>
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Загрузка…
      </div>
    )
  }

  if (result && result.dataType === 'array_columns') {
    return <ArrayColumnsResult result={result} />
  }
}

export function ArrayColumnsResult({ result }: { result: FetchConfigResult }) {
  if (!result || result.dataType !== 'array_columns') return null

  const columns = result.columns || []
  const rows = Array.isArray(result.data) ? result.data : []
  const count = typeof result.count === 'number' ? result.count : rows.length
  const progress = typeof result.progress === 'number' ? result.progress : undefined

  const formatCell = (value: any) => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">
        Строк: {count}
        {typeof progress === 'number' && <> • Прогресс: {progress}%</>}
      </div>

      <div className="overflow-auto max-h-64 border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="text-left p-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t">
                {columns.map((col) => (
                  <td key={col} className="p-2 align-top">
                    {formatCell(row?.[col])}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={columns.length || 1}>
                  Нет данных для отображения
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

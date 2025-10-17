import { useEffect, useState } from 'react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel, FieldError } from '~/components/ui/field'
import { DataSourceOption, DataSourceSelect } from './data-source-select'
import { ParamsEditor, ParamItem } from './params-editor'
import { ResultTable } from './result-table'
import { IconPlayerPlay, IconTrash, IconCheck, IconPencil } from '@tabler/icons-react'

export function SqlQuery({
  dataSources,
  initialSql = '',
  initialParams = [],
  result,
  onApply,
  onRemove,
}: {
  dataSources: DataSourceOption[]
  initialSql?: string
  initialParams?: ParamItem[]
  result?: {
    rows: Array<Record<string, any>>
    columns?: string[]
    loading?: boolean
    error?: string
  }
  onApply?: (payload: { dataSourceId: number | null; sql: string; params: ParamItem[] }) => void
  onRemove?: () => void
}) {
  const [dataSourceId, setDataSourceId] = useState<number | null>(null)
  const [sql, setSql] = useState<string>(initialSql)
  const [params, setParams] = useState<ParamItem[]>(initialParams)
  const [inputMode, setInputMode] = useState<'textarea' | 'code'>('textarea')

  // Автоматически переключаем режим ввода в зависимости от результата
  useEffect(() => {
    if (!result) return
    if (result.loading) return
    if (result.error) {
      setInputMode('textarea')
    } else {
      setInputMode('code')
    }
  }, [result?.loading, result?.error])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>SQL запрос</CardTitle>
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Перевыполнить"
              onClick={() => onApply?.({ dataSourceId, sql, params })}
            >
              <IconPlayerPlay />
              <span className="sr-only">Перевыполнить</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Удалить блок"
              onClick={() => onRemove?.()}
            >
              <IconTrash />
              <span className="sr-only">Удалить блок</span>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataSourceSelect
            options={dataSources}
            value={dataSourceId}
            onChange={(id) => {
              setDataSourceId(id)
              // При смене источника возвращаемся в режим редактирования
              setInputMode('textarea')
            }}
          />
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel className="flex w-full items-center justify-between">
                <span>SQL запрос</span>
                {inputMode === 'code' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Редактировать"
                    onClick={() => setInputMode('textarea')}
                  >
                    <IconPencil />
                    <span className="sr-only">Редактировать</span>
                  </Button>
                )}
              </FieldLabel>
            </div>

            {inputMode === 'textarea' ? (
              <>
                <textarea
                  className="min-h-40 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="SELECT * FROM table WHERE ..."
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                />
                {sql.trim().length === 0 && (
                  <FieldError className="mt-2">SQL не может быть пустым</FieldError>
                )}
                {result?.error && <FieldError className="mt-2">{result.error}</FieldError>}
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Применить"
                    onClick={() => setInputMode('code')}
                  >
                    <IconCheck />
                    <span className="sr-only">Применить</span>
                  </Button>
                </div>
              </>
            ) : (
              <pre className="min-h-40 w-full rounded-md border px-3 py-2 text-sm font-mono whitespace-pre-wrap">
                <code>{sql}</code>
              </pre>
            )}
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <ParamsEditor value={params} onChange={setParams} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <ResultTable
            rows={result?.rows ?? []}
            columns={result?.columns}
            loading={result?.loading}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" onClick={() => onApply?.({ dataSourceId, sql, params })}>
          Применить
        </Button>
      </div>
    </div>
  )
}

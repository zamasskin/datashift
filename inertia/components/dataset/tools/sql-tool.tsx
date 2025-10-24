import { useMemo, useState } from 'react'
import { Dataset, SqlSaveProps } from '~/interfaces/datasets'
import { IconCheck, IconPencil, IconTrash } from '@tabler/icons-react'
import { Button } from '~/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { DataSourceSelect } from '../../datasource/data-source-select'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Spinner } from '~/components/ui/spinner'
import { Plus } from 'lucide-react'
import * as _ from 'lodash'
import { VariableInput } from '../variable-input'
import { usePage } from '@inertiajs/react'
import { DataSourcePreview } from '../../datasource/data-source-preview'
import { Kbd } from '~/components/ui/kbd'
import { Badge } from '~/components/ui/badge'

export interface SqlToolProps {
  data: Dataset & { type: 'sql' }
  datasets?: Dataset[]
  fields?: string[]
  params?: Record<string, any>
  isEditMode?: boolean
  onSave?: (saved: SqlSaveProps) => void
  onDelete?: () => void
}

export function SqlTool(props: SqlToolProps) {
  const { props: pageProps } = usePage<{ csrfToken: string }>()
  const [isEditMode, setIsEditMode] = useState(!props.data.value)
  const [query, setQuery] = useState(props.data.value || '')
  const [variables, setVariables] = useState(props.data.variables || [])
  const [error, setError] = useState('')
  const [onLoading, setOnLoading] = useState(false)
  const [dataSourceId, setDataSourceId] = useState(props.data.dataSourceId || undefined)
  const [variable, setVariable] = useState('')

  const savedVariables = useMemo(
    () => _.filter([...variables, variable], (v) => v !== ''),
    [variable, variables]
  )

  const onSave = async () => {
    setError('')

    try {
      setOnLoading(true)
      // отправим запрос на проверку
      const oldDatasets = props.datasets || []
      const newDataset = {
        ...props.data,
        value: query,
        variables: savedVariables,
        dataSourceId,
      }

      const body = JSON.stringify({
        datasets: [...oldDatasets, newDataset],
        params: props.params,
        limit: 1,
        offset: 0,
      })

      const request = await fetch('/datasets/test-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': pageProps.csrfToken },
        body,
      })
      const data = await request.json()
      if (data.error) {
        setError(data.error || 'SQL запрос некорректен')
      } else {
        setIsEditMode(false)
        props.onSave?.({
          query,
          variables: savedVariables,
          dataSourceId: dataSourceId || 0,
          fields: data?.fields || [],
        })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setOnLoading(false)
    }

    // props.data.value = query
    // props.data.variables = vars
    // props.data.dataSourceId = dataSourceId
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex gap-2">
            Sql запрос <Badge variant="outline">{props.data.name}</Badge>
          </div>
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Удалить блок"
            onClick={props.onDelete}
          >
            <IconTrash />
            <span className="sr-only">Удалить блок</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditMode ? (
          <DataSourceSelect value={dataSourceId} onChange={setDataSourceId} />
        ) : (
          <DataSourcePreview dataSourceId={dataSourceId || 0} />
        )}

        {dataSourceId && (
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel className="flex w-full items-center justify-between">
                <span>SQL запрос</span>
                {!isEditMode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Редактировать"
                    onClick={() => setIsEditMode(true)}
                  >
                    <IconPencil />
                    <span className="sr-only">Редактировать</span>
                  </Button>
                )}
              </FieldLabel>
            </div>

            {isEditMode && (
              <>
                <div className="space-y-3">
                  <textarea
                    className="min-h-40 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="SELECT * FROM table WHERE ..."
                    value={query}
                    onChange={(ev) => setQuery(ev.target.value)}
                  />

                  <div className="space-y-2">
                    {variables.map((v, idx) => (
                      <div key={idx} className="flex gap-2 w-[300px]">
                        <VariableInput
                          params={props.fields}
                          value={v}
                          onChange={(ev) =>
                            setVariables((prev) => {
                              const next = [...prev]
                              next[idx] = ev.target.value
                              return next
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Удалить переменную"
                          onClick={() => setVariables((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <IconTrash />
                          <span className="sr-only">Удалить переменную</span>
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 w-[300px]">
                    <VariableInput
                      params={props.fields || []}
                      value={variable}
                      onChange={(ev) => setVariable(ev.target.value)}
                      placeholder="Переменная"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Добавить"
                      disabled={!variable.trim()}
                      onClick={() => {
                        const v = variable.trim()
                        if (!v) return
                        setVariables((prev) => [...prev, v])
                        setVariable('')
                      }}
                    >
                      <Plus />
                      <span className="sr-only">Добавить</span>
                    </Button>
                  </div>
                </div>
                {error && <FieldError className="mt-2">{error}</FieldError>}
                <div className="mt-2 flex justify-end">
                  {onLoading && <Spinner />}
                  {!onLoading && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Применить"
                      onClick={onSave}
                    >
                      <IconCheck />
                      <span className="sr-only">Применить</span>
                    </Button>
                  )}
                </div>
              </>
            )}

            {!isEditMode && (
              <div className="space-y-4">
                <pre className="min-h-40 w-full rounded-md border px-3 py-2 text-sm font-mono whitespace-pre-wrap">
                  <code>{props.data.value}</code>
                </pre>

                {savedVariables.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <div className="font-mono">Переменные:</div>
                    <div className="flex gap-2">
                      {savedVariables.map((v) => (
                        <Kbd key={v}>{v}</Kbd>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Field>
        )}
      </CardContent>
    </Card>
  )
}

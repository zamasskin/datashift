import { IconCheck, IconPencil, IconPlayerPlay, IconTrash } from '@tabler/icons-react'
import { Button } from '../ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { DataSourceSelect } from './data-source-select'
import { Field, FieldError, FieldLabel } from '../ui/field'
import { useState } from 'react'
import { Spinner } from '../ui/spinner'
import { Plus } from 'lucide-react'
import * as _ from 'lodash'
import { VariableInput } from './variable-input'

type QueryToolProps = {
  name: string
  value?: string
  dataSourceId?: number
  variables?: string[]
  params?: string[]

  onSetDatasource?: (dataSourceId: number) => void
  onUpdateColumns?: (columns: string[]) => void
  onSetEditMode?: (isEditMode: boolean) => void
  onApply: (query: string, variables: string[]) => Promise<void>
}

export function QueryTool(props: QueryToolProps) {
  const [isEditMode, setIsEditMode] = useState(!props.value)
  const [error, setError] = useState<string>()
  const [onLoading, setOnLoading] = useState(false)

  const [datasetName, setDatasetName] = useState(props.name || '')
  const [query, setQuery] = useState(props.value || '')
  const [vars, setVars] = useState(props.variables || [])
  const [variable, setVariable] = useState('')

  const onApply = async () => {
    setError('')
    if (!props.onApply) {
      setError('onApply is not defined')
      return
    }

    try {
      setOnLoading(true)
      await props.onApply(query, vars)
      setIsEditMode(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setOnLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? (
            <Input value={datasetName} onChange={(ev) => setDatasetName(ev.target.value)} />
          ) : (
            <span>{datasetName}</span>
          )}
        </CardTitle>
        <CardAction>
          {!isEditMode && (
            <Button type="button" variant="ghost" size="icon" title="Перевыполнить">
              <IconPlayerPlay />
              <span className="sr-only">Перевыполнить</span>
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon" title="Удалить блок">
            <IconTrash />
            <span className="sr-only">Удалить блок</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <DataSourceSelect value={props.dataSourceId} onChange={props.onSetDatasource} />
        {props.dataSourceId && (
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
                    // onClick={() => onEditModeChange(true)}
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
                    {vars.map((v, idx) => (
                      <div key={idx} className="flex gap-2 w-[300px]">
                        <VariableInput
                          params={props.params}
                          value={v}
                          onChange={(ev) =>
                            setVars((prev) => {
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
                          onClick={() => setVars((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <IconTrash />
                          <span className="sr-only">Удалить переменную</span>
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 w-[300px]">
                    <VariableInput
                      params={props.params}
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
                        setVars((prev) => [...prev, v])
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
                      onClick={onApply}
                    >
                      <IconCheck />
                      <span className="sr-only">Применить</span>
                    </Button>
                  )}
                </div>
              </>
            )}

            {!isEditMode && (
              <pre className="min-h-40 w-full rounded-md border px-3 py-2 text-sm font-mono whitespace-pre-wrap">
                <code>{props.value}</code>
              </pre>
            )}
          </Field>
        )}
      </CardContent>
    </Card>
  )
}

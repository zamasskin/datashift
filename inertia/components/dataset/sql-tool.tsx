import { IconCheck, IconPencil, IconPlayerPlay, IconTrash } from '@tabler/icons-react'
import { Button } from '../ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DataSourceSelect } from './data-source-select'
import { Field, FieldError, FieldLabel } from '../ui/field'
import { useEffect, useState } from 'react'
import { Spinner } from '../ui/spinner'
import { usePage } from '@inertiajs/react'

export type SqlToolProps = {
  isShowDeleteButton?: boolean
  isEditMode?: boolean
  dataSourceId?: number
  value: string
  onChangeEditMode?: (isEditMode: boolean) => void
  onChangeDataSourceId?: (dataSourceId: number) => void
  onChangeValue?: (value: string) => void
}

export function SqlTool(props: SqlToolProps) {
  const { isShowDeleteButton = true } = props
  const { props: pageProps } = usePage<{ csrfToken: string }>()
  const [value, setValue] = useState(props.value)
  const [isEditMode, setIsEditMode] = useState(!props.value)
  const [error, setError] = useState('')
  const [onLoading, setOnLoading] = useState(false)

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const onEditModeChange = (isEditMode: boolean) => {
    setIsEditMode(isEditMode)
    props.onChangeEditMode?.(isEditMode)
  }

  const onApplySql = async () => {
    // выполним проверку sql запроса
    try {
      setOnLoading(true)
      setError('')
      if (!value || !String(value).trim()) {
        setError('SQL запрос не может быть пустым')
        return
      }
      // отправим запрос на проверку
      const request = await fetch('/datasets/test-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': pageProps.csrfToken },
        body: JSON.stringify({ sql: value, dataSourceId: props.dataSourceId }),
      })
      const data = await request.json()
      if (data.error) {
        setError(data.error || 'SQL запрос некорректен')
      } else {
        onEditModeChange(false)
        props.onChangeValue?.(value)
      }
    } catch (err) {
      console.log(err)
      setError('SQL запрос некорректен')
    } finally {
      setOnLoading(false)
    }
  }

  return (
    <div className="">
      <Card>
        <CardHeader>
          <CardTitle>SQL запрос</CardTitle>
          <CardAction>
            {!isEditMode && (
              <Button type="button" variant="ghost" size="icon" title="Перевыполнить">
                <IconPlayerPlay />
                <span className="sr-only">Перевыполнить</span>
              </Button>
            )}
            {isShowDeleteButton && (
              <Button type="button" variant="ghost" size="icon" title="Удалить блок">
                <IconTrash />
                <span className="sr-only">Удалить блок</span>
              </Button>
            )}
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataSourceSelect value={props.dataSourceId} onChange={props.onChangeDataSourceId} />
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
                      onClick={() => onEditModeChange(true)}
                    >
                      <IconPencil />
                      <span className="sr-only">Редактировать</span>
                    </Button>
                  )}
                </FieldLabel>
              </div>

              {isEditMode && (
                <>
                  <textarea
                    className="min-h-40 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="SELECT * FROM table WHERE ..."
                    value={value}
                    onChange={(ev) => setValue(ev.target.value)}
                  />
                  {error && <FieldError className="mt-2">{error}</FieldError>}
                  {/* {result?.error && <FieldError className="mt-2">{result.error}</FieldError>} */}
                  <div className="mt-2 flex justify-end">
                    {onLoading && <Spinner />}
                    {!onLoading && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Применить"
                        onClick={onApplySql}
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
    </div>
  )
}

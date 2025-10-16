import { useMemo, useState } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { ResultTable } from './result-table'
import { IconPlayerPlay } from '@tabler/icons-react'
import { IconTrash } from '@tabler/icons-react'

type EnrichmentMode = 'compose' | 'script'

export function DataEnrichment({
  sourceRows,
  sourceColumns,
  result,
  onApply,
  onRemove,
}: {
  sourceRows: Array<Record<string, any>>
  sourceColumns?: string[]
  result?: { rows: Array<Record<string, any>>; columns?: string[]; loading?: boolean }
  onApply?: (payload: {
    mode: EnrichmentMode
    newColumnName: string
    selectedColumns?: string[]
    joiner?: string
    script?: string
  }) => void
  onRemove?: () => void
}) {
  const cols = useMemo(() => {
    if (sourceColumns?.length) return sourceColumns
    const set = new Set<string>()
    sourceRows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k)))
    return Array.from(set)
  }, [sourceRows, sourceColumns])

  const [newColumnName, setNewColumnName] = useState<string>('new_column')
  const [mode, setMode] = useState<EnrichmentMode>('compose')
  const [selectedColumns, setSelectedColumns] = useState<string[]>(cols.slice(0, 2))
  const [joiner, setJoiner] = useState<string>(' ')
  const [script, setScript] = useState<string>(
    cols.length >= 2 ? `row[cols[0]] + " " + row[cols[1]]` : `Object.values(row).join(" ")`
  )

  const addSelectedColumn = () => setSelectedColumns([...selectedColumns, cols[0] || ''])
  const removeSelectedColumn = (idx: number) =>
    setSelectedColumns(selectedColumns.filter((_, i) => i !== idx))
  const patchSelectedColumn = (idx: number, value: string) => {
    const next = selectedColumns.slice()
    next[idx] = value
    setSelectedColumns(next)
  }

  const handleApply = () => onApply?.({ mode, newColumnName, selectedColumns, joiner, script })

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Перевыполнить"
              onClick={handleApply}
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
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Новая колонка</FieldLabel>
              <Input
                placeholder="имя столбца"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Режим</FieldLabel>
              <Select value={mode} onValueChange={(v) => setMode(v as EnrichmentMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compose">Собрать из колонок</SelectItem>
                  <SelectItem value="script">JS-скрипт</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {mode === 'compose' ? (
            <Field>
              <FieldLabel>Колонки для сборки</FieldLabel>
              {selectedColumns.map((c, idx) => (
                <div key={idx} className="mb-2 flex gap-2">
                  <Select value={c || undefined} onValueChange={(v) => patchSelectedColumn(idx, v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="колонка" />
                    </SelectTrigger>
                    <SelectContent>
                      {cols.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => removeSelectedColumn(idx)}
                  >
                    Удалить
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSelectedColumn}>
                Добавить колонку
              </Button>
            </Field>
          ) : (
            <Field>
              <FieldLabel>JS выражение</FieldLabel>
              <textarea
                className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                placeholder={`row['colA'] + ' - ' + row['colB']`}
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />
              <div className="text-muted-foreground text-xs">
                Доступны переменные: <code>row</code> и <code>cols</code>. Верните значение новой
                колонки.
              </div>
            </Field>
          )}

          {mode === 'compose' && (
            <Field>
              <FieldLabel>Разделитель</FieldLabel>
              <Input placeholder=" " value={joiner} onChange={(e) => setJoiner(e.target.value)} />
            </Field>
          )}
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
        <Button type="button" onClick={handleApply}>
          Применить
        </Button>
      </div>
    </div>
  )
}

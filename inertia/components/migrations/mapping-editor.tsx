import { useMemo, useState } from 'react'
import { Field, FieldLabel } from '~/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { DataSourceSelect } from '~/components/datasource/data-source-select'

export type MappingEditorProps = {
  tables?: string[]
  fields?: string[]
  resultColumns?: string[]
  onSave?: (mapping: {
    source?: string
    table?: string
    fieldMappings: { sourceField: string; targetColumn?: string }[]
    conditions: { leftField: string; operator: '='; rightColumn: string }[]
    name?: string
  }) => void
  onCancel?: () => void
}

export function MappingEditor({
  tables = [],
  fields = [],
  resultColumns = [],
  onSave,
  onCancel,
}: MappingEditorProps) {
  const [sourceId, setSourceId] = useState<number | undefined>(undefined)
  const [table, setTable] = useState<string>('')

  const [fieldMappings, setFieldMappings] = useState<{ sourceField: string; targetColumn?: string }[]>(
    () => fields.map((f) => ({ sourceField: f, targetColumn: undefined }))
  )
  const [conditions, setConditions] = useState<{ leftField: string; operator: '='; rightColumn: string }[]>([])

  const canSave = useMemo(() => !!sourceId && !!table && fieldMappings.length > 0, [sourceId, table, fieldMappings])

  const addCondition = () => {
    setConditions((prev) => [...prev, { leftField: '', operator: '=', rightColumn: '' }])
  }

  const patchCondition = (idx: number, patch: Partial<{ leftField: string; operator: '='; rightColumn: string }>) => {
    setConditions((prev) => {
      const next = prev.slice()
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }

  const removeCondition = (idx: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== idx))
  }

  const patchMappingTarget = (idx: number, target?: string) => {
    setFieldMappings((prev) => {
      const next = prev.slice()
      next[idx] = { ...next[idx], targetColumn: target }
      return next
    })
  }

  const handleSave = () => {
    onSave?.({ source: sourceId != null ? String(sourceId) : undefined, table, fieldMappings, conditions })
  }

  return (
    <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
      {/* Поле названия удалено по требованию для экономии вертикального пространства */}

      <div className="flex gap-3">
        <div className="flex-1">
          <DataSourceSelect value={sourceId} onChange={setSourceId} />
        </div>

        <Field className="flex-1">
          <FieldLabel>Таблица</FieldLabel>
          <Select value={table} onValueChange={setTable}>
            <SelectTrigger className="h-8 min-w-40">
              <SelectValue placeholder="Выберите таблицу" />
            </SelectTrigger>
            <SelectContent>
              {tables.length > 0 ? (
                tables.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__no_tables__" disabled>
                  Нет таблиц
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Поля источника</FieldLabel>
          <div className="flex flex-col gap-2">
            {fieldMappings.map((m, idx) => (
              <div key={m.sourceField || idx} className="flex items-center gap-2">
                <Input value={m.sourceField} readOnly className="h-8" />
              </div>
            ))}
            {fieldMappings.length === 0 && (
              <div className="text-sm text-muted-foreground">Нет полей для отображения</div>
            )}
          </div>
        </Field>

        <Field>
          <FieldLabel>Колонки последнего результата</FieldLabel>
          <div className="flex flex-col gap-2">
            {fieldMappings.map((m, idx) => (
              <Select key={m.sourceField || idx} value={m.targetColumn || ''} onValueChange={(v) => patchMappingTarget(idx, v)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Выберите колонку" />
                </SelectTrigger>
                <SelectContent>
                  {resultColumns.length > 0 ? (
                    resultColumns.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_cols__" disabled>
                      Нет колонок
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            ))}
          </div>
        </Field>
      </div>

      <Field>
        <FieldLabel>Условия совпадения</FieldLabel>
        <div className="flex flex-col gap-2 max-h-[32vh] overflow-y-auto pr-1">
          {conditions.map((cond, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Select value={cond.leftField} onValueChange={(v) => patchCondition(idx, { leftField: v })}>
                <SelectTrigger className="h-8 min-w-40">
                  <SelectValue placeholder="Поле источника" />
                </SelectTrigger>
                <SelectContent>
                  {fields.length > 0 ? (
                    fields.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_fields__" disabled>
                      Нет полей
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Input value={cond.operator} readOnly className="h-8 w-16 text-center" />

              <Select value={cond.rightColumn} onValueChange={(v) => patchCondition(idx, { rightColumn: v })}>
                <SelectTrigger className="h-8 min-w-40">
                  <SelectValue placeholder="Колонка результата" />
                </SelectTrigger>
                <SelectContent>
                  {resultColumns.length > 0 ? (
                    resultColumns.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_cols__" disabled>
                      Нет колонок
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Button type="button" variant="ghost" size="sm" onClick={() => removeCondition(idx)}>
                Удалить
              </Button>
            </div>
          ))}

          <div>
            <Button type="button" variant="outline" onClick={addCondition}>
              Добавить условие
            </Button>
          </div>
        </div>
      </Field>

      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleSave} disabled={!canSave}>
          Сохранить соответствие
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
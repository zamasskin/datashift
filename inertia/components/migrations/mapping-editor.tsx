import { useMemo, useState } from 'react'
import { Field, FieldLabel } from '~/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { SaveMapping } from '#interfaces/save_mapping'

export type MappingEditorProps = {
  resultColumns?: string[]
  onSave?: (mapping: SaveMapping) => void
  onCancel?: () => void
}

export function MappingEditor({ resultColumns = [], onSave, onCancel }: MappingEditorProps) {
  const [datasetIdInput, setDatasetIdInput] = useState<string>('')
  const [source, setSource] = useState<string>('')

  const canSave = useMemo(() => {
    const id = Number(datasetIdInput)
    return Number.isFinite(id) && id > 0 && !!source
  }, [datasetIdInput, source])

  const handleSave = () => {
    const id = Number(datasetIdInput)
    if (!Number.isFinite(id) || id <= 0 || !source) return
    const payload: SaveMapping = {
      id: Date.now().toString(36),
      sourceId: id,
      savedMapping: [],
      updateOn: [],
    }
    onSave?.(payload)
  }

  return (
    <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
      <div className="flex gap-3">
        <Field className="flex-1">
          <FieldLabel>ID датасета</FieldLabel>
          <Input
            type="number"
            value={datasetIdInput}
            onChange={(e) => setDatasetIdInput(e.target.value)}
            className="h-8 min-w-40"
            placeholder="Укажите ID датасета"
          />
        </Field>

        <Field className="flex-1">
          <FieldLabel>Источник (колонка результата)</FieldLabel>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-8 min-w-40">
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
        </Field>
      </div>

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
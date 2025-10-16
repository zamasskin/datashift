import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Field, FieldLabel } from '~/components/ui/field'

export type DataSourceOption = {
  id: number
  name: string
  type?: string
}

export function DataSourceSelect({
  label = 'Источник данных',
  value,
  options,
  onChange,
}: {
  label?: string
  value?: number | null
  options: DataSourceOption[]
  onChange?: (id: number | null) => void
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        value={value != null ? String(value) : undefined}
        onValueChange={(v) => onChange?.(v ? Number(v) : null)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Выберите источник" />
        </SelectTrigger>
        <SelectContent>
          {options.map((ds) => (
            <SelectItem key={ds.id} value={String(ds.id)}>
              {ds.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
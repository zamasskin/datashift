import { Field, FieldLabel, FieldGroup } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { DatasetParamItem } from '~/components/dataset/params-editor'
import { EraserIcon } from 'lucide-react'

export function ParamsValues({
  items = [],
  onChange,
  className,
}: {
  items?: DatasetParamItem[]
  onChange?: (items: DatasetParamItem[]) => void
  className?: string
}) {
  const update = (next: DatasetParamItem[]) => onChange?.(next)

  const setItem = (idx: number, patch: Partial<DatasetParamItem>) => {
    const next = items.slice()
    next[idx] = { ...next[idx], ...patch }
    update(next)
  }

  const clearAll = () => {
    const next = items.map((i) => ({ ...i, value: '', valueFrom: '', valueTo: '' }))
    update(next)
  }

  return (
    <Field className={className}>
      {items.length > 0 && (
        <FieldLabel className="flex justify-end">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={clearAll}>
              <EraserIcon />
              Очистить значения
            </Button>
          </div>
        </FieldLabel>
      )}
      <FieldGroup className="flex-row items-center gap-2 overflow-x-auto whitespace-nowrap">
        {items.length === 0 && <div className="text-sm text-muted-foreground">Нет параметров</div>}

        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col items-start gap-1.5 whitespace-nowrap">
            <div className="h-4 text-xs font-medium flex items-center">{item.key || ''}</div>
            {item.type === 'date_range' ? (
              <div className="flex gap-1.5">
                <Input
                  className="h-8"
                  type="date"
                  placeholder="с"
                  value={item.valueFrom || ''}
                  onChange={(e) => setItem(idx, { valueFrom: e.target.value })}
                />
                <Input
                  className="h-8"
                  type="date"
                  placeholder="по"
                  value={item.valueTo || ''}
                  onChange={(e) => setItem(idx, { valueTo: e.target.value })}
                />
              </div>
            ) : (
              <Input
                className="h-8"
                placeholder="значение"
                type={item.type === 'number' ? 'number' : item.type === 'date' ? 'date' : 'text'}
                value={item.value || ''}
                onChange={(e) => setItem(idx, { value: e.target.value })}
              />
            )}
          </div>
        ))}
      </FieldGroup>
    </Field>
  )
}

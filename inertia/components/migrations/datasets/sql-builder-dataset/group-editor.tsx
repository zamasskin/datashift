import { Trash } from 'lucide-react'
import { Autocomplete } from '~/components/ui/autocomplete'
import { Button } from '~/components/ui/button'
import { Item, ItemContent } from '~/components/ui/item'
import { useI18n } from '~/hooks/useI18nLocal'

export type GroupEditorProps = {
  suggestions?: string[]
  value?: string[]
  onChange?: (value: string[]) => void
}

export function GroupEditor({ suggestions, value, onChange }: GroupEditorProps) {
  const { t } = useI18n()
  const groups = Array.isArray(value) ? value : []

  return (
    <div className="space-y-2">
      {groups.map((sel, idx) => (
        <Item key={idx} variant="outline">
          <ItemContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-[240px]">
                <Autocomplete
                  suggestions={suggestions}
                  value={sel}
                  onValueChange={(v) => {
                    if (onChange) {
                      const next = [...groups]
                      next[idx] = v
                      onChange(next)
                    }
                  }}
                  placeholder={String(
                    t('datasets.sql-builder.fieldPlaceholder', 'таблица.колонка')
                  )}
                />
              </div>
              <Button
                variant="secondary"
                className="h-8"
                onClick={() => {
                  if (onChange) {
                    const next = groups.filter((_, i) => i !== idx)
                    onChange(next)
                  }
                }}
              >
                <Trash className="size-4" />{' '}
                {String(t('datasets.sql-builder.deleteBtnName', 'Удалить'))}
              </Button>
            </div>
          </ItemContent>
        </Item>
      ))}

      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (onChange) {
              onChange([...groups, ''])
            }
          }}
        >
          {String(
            t('datasets.sql-builder.groupEditor.addFieldBtnName', 'Добавить поле группировки')
          )}
        </Button>
      </div>
    </div>
  )
}

export default GroupEditor

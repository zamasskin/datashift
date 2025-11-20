import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Trash } from 'lucide-react'
import { Autocomplete } from '~/components/ui/autocomplete'
import { Button } from '~/components/ui/button'
import { Item, ItemContent } from '~/components/ui/item'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useI18n } from '~/hooks/useI18nLocal'

export type OrderItemRecord = Record<string, 'asc' | 'desc'>

export type OrdersEditorProps = {
  suggestions?: string[]
  value?: OrderItemRecord[]
  onChange?: (value: OrderItemRecord[]) => void
}

export function OrdersEditor({ suggestions, value, onChange }: OrdersEditorProps) {
  const { t } = useI18n()
  const orders = Array.isArray(value) ? value : []

  const handleKeyChange = (idx: number, key: string) => {
    if (!onChange) return
    const current = orders[idx] || {}
    const dir = (Object.values(current)[0] as 'asc' | 'desc') || 'asc'
    const next = [...orders]
    next[idx] = { [key]: dir }
    onChange(next)
  }

  const handleDirChange = (idx: number, dir: 'asc' | 'desc') => {
    if (!onChange) return
    const current = orders[idx] || {}
    const key = Object.keys(current)[0] || ''
    const next = [...orders]
    next[idx] = { [key]: dir }
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <ScrollArea className="max-h-72 max-w-full overflow-scroll">
        <div className="space-y-2">
          {orders.map((rec, idx) => {
            const key = Object.keys(rec)[0] || ''
            const dir = (Object.values(rec)[0] as 'asc' | 'desc') || 'asc'
            return (
              <Item key={idx} variant="outline">
                <ItemContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-[240px]">
                      <Autocomplete
                        suggestions={suggestions}
                        value={key}
                        onValueChange={(v) => handleKeyChange(idx, v)}
                        placeholder={String(
                          t('datasets.sql-builder.fieldPlaceholder', 'таблица.колонка')
                        )}
                      />
                    </div>
                    <div className="w-[160px]">
                      <Select
                        value={dir}
                        onValueChange={(v) => handleDirChange(idx, v as 'asc' | 'desc')}
                      >
                        <SelectTrigger size="sm">
                          <SelectValue
                            placeholder={String(
                              t(
                                'datasets.sql-builder.orderEditor.directionPlaceholder',
                                'направление'
                              )
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">
                            {String(
                              t('datasets.sql-builder.orderEditor.ascLabel', 'По возрастанию')
                            )}
                          </SelectItem>
                          <SelectItem value="desc">
                            {String(t('datasets.sql-builder.orderEditor.descLabel', 'По убыванию'))}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="secondary"
                      className="h-8"
                      onClick={() => {
                        if (onChange) {
                          const next = orders.filter((_, i) => i !== idx)
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
            )
          })}
        </div>
      </ScrollArea>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (onChange) {
              onChange([...orders, { '': 'asc' }])
            }
          }}
        >
          {String(t('datasets.sql-builder.orderEditor.addOrderBtnName', 'Добавить сортировку'))}
        </Button>
      </div>
    </div>
  )
}

export default OrdersEditor

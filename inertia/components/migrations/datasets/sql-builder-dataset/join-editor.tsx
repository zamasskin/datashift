import { PlusIcon, SearchIcon, TrashIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Item, ItemActions, ItemContent } from '~/components/ui/item'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useEffect, useRef } from 'react'
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '~/components/ui/field'
import { TableSelect } from '../../table-select'
import { Input } from '~/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '~/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export type JoinItem = {
  table: string
  alias?: string
  type: 'inner' | 'left' | 'right' | 'full'
  on: {
    tableColumn: string
    aliasColumn: string
    operator: '=' | '!=' | '<' | '<=' | '>' | '>='
    cond?: 'and' | 'or'
  }[]
}

export type JoinEditorProps = {
  data?: JoinItem[]
  tables?: string[]
  onChange?: (data: JoinItem[]) => void
}

export function JoinEditor({ data, tables, onChange }: JoinEditorProps) {
  if (!tables || tables.length === 0) {
    return <div>Для выбранных источников данных таблицы не найдены.</div>
  }

  const bottomRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [data?.length])

  return (
    <div className="space-y-4">
      <ScrollArea className="max-h-72 max-w-full overflow-scroll">
        <div className="space-y-2">
          {data?.map((item, idx) => (
            <Item variant="outline" key={idx}>
              <ItemContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-2">
                    <Field>
                      <FieldLabel>Таблица</FieldLabel>
                      <FieldContent className="w-full">
                        <TableSelect
                          tables={tables}
                          selectedTable={item.table}
                          onSelectTable={(table) => {
                            if (onChange) {
                              const updated = data || []
                              updated[idx].table = table
                              onChange([...updated])
                            }
                          }}
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel>Алиас</FieldLabel>
                      <Input
                        value={item.alias}
                        onChange={(ev) => {
                          if (onChange) {
                            const updated = data || []
                            updated[idx] = { ...updated[idx], alias: ev.target.value }
                            onChange([...updated])
                          }
                        }}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor="name">Тип соединения</FieldLabel>
                    </FieldContent>
                    <Select
                      value={item.type}
                      onValueChange={(value: JoinItem['type']) => {
                        if (onChange) {
                          const updated = data || []
                          updated[idx].type = value
                          onChange([...updated])
                        }
                      }}
                    >
                      <SelectTrigger className="min-w-40 h-8" title="Тип параметра">
                        <SelectValue placeholder="тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inner">Внутреннее соединение</SelectItem>
                        <SelectItem value="left">Левое соединение</SelectItem>
                        <SelectItem value="right">Правое соединение</SelectItem>
                        <SelectItem value="full">Полное соединение</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {item.on.map((on, onIdx) => {
                    return (
                      <Item key={onIdx} variant="outline">
                        Тут букава настройка условия
                      </Item>
                    )
                  })}
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      // TODO: Добавить условие
                    }}
                  >
                    <PlusIcon /> Добавить условие
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (onChange) {
                        const updated = (data || []).filter((_, i) => i !== idx)
                        onChange([...updated])
                      }
                    }}
                  >
                    <TrashIcon /> Удалить связь
                  </Button>
                </div>
              </ItemContent>
            </Item>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="flex">
        <Button
          onClick={() => {
            if (onChange) {
              const updated = data || []
              updated.push({
                table: tables[0],
                type: 'inner',
                alias: '',
                on: [{ tableColumn: '', aliasColumn: '', operator: '=' }],
              })
              onChange([...updated])
            }
          }}
        >
          <PlusIcon /> Добавить связь
        </Button>
      </div>
    </div>
  )
}

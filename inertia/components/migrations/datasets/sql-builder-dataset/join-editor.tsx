import { PlusIcon, TrashIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Item, ItemContent } from '~/components/ui/item'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useEffect, useRef } from 'react'
import { Field, FieldContent, FieldLabel } from '~/components/ui/field'
import { TableSelect } from '../../table-select'
import { Input } from '~/components/ui/input'
import { Autocomplete } from '~/components/ui/autocomplete'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useI18n } from '~/hooks/useI18nLocal'

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
  columnsMap?: Record<string, string[]>
  baseTable?: string
  baseAlias?: string
  onChange?: (data: JoinItem[]) => void
}

export function JoinEditor({
  data,
  tables,
  columnsMap,
  baseTable,
  baseAlias,
  onChange,
}: JoinEditorProps) {
  const { t } = useI18n()
  if (!tables || tables.length === 0) {
    return (
      <div>
        {String(
          t('datasets.sql-builder.noTablesFound', 'Для выбранных подключений таблицы не найдены.')
        )}
      </div>
    )
  }

  const operators = ['=', '!=', '<', '<=', '>', '>='] as const
  const conds = ['and', 'or'] as const

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
                      <FieldLabel>
                        {String(t('datasets.sql-builder.tableLabel', 'Таблица'))}
                      </FieldLabel>
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
                      <FieldLabel>
                        {String(t('datasets.sql-builder.aliasLabel', 'Алиас'))}
                      </FieldLabel>
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
                      <FieldLabel htmlFor="name">
                        {String(t('datasets.sql-builder.join.typeLabel', 'Тип соединения'))}
                      </FieldLabel>
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
                      <SelectTrigger
                        className="min-w-40 h-8"
                        title={String(t('datasets.sql-builder.join.typeLabel', 'Тип соединения'))}
                      >
                        <SelectValue
                          placeholder={String(
                            t('datasets.sql-builder.join.typePlaceholder', 'тип')
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inner">
                          {String(
                            t('datasets.sql-builder.join.innerLabel', 'Внутреннее соединение')
                          )}
                        </SelectItem>
                        <SelectItem value="left">
                          {String(t('datasets.sql-builder.join.leftLabel', 'Левое соединение'))}
                        </SelectItem>
                        <SelectItem value="right">
                          {String(t('datasets.sql-builder.join.rightLabel', 'Правое соединение'))}
                        </SelectItem>
                        <SelectItem value="full">
                          {String(t('datasets.sql-builder.join.fullLabel', 'Полное соединение'))}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {item.on.map((on, onIdx) => {
                    return (
                      <Item key={onIdx} variant="outline">
                        <div className="flex flex-wrap items-center gap-2">
                          {onIdx === 0 ? (
                            <div className="text-muted-foreground text-xs font-medium">ON</div>
                          ) : (
                            <Select
                              value={on.cond || 'and'}
                              onValueChange={(v) => {
                                if (onChange) {
                                  const updated = data || []
                                  const join = updated[idx]
                                  join.on[onIdx] = { ...join.on[onIdx], cond: v as 'and' | 'or' }
                                  onChange([...updated])
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 min-w-20" title="Логика">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {conds.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          <div className="flex-1 min-w-[220px]">
                            <Autocomplete
                              suggestions={(columnsMap?.[item.table] || []).map(
                                (c) => `${item.alias || item.table}.${c}`
                              )}
                              value={on.tableColumn}
                              onValueChange={(value) => {
                                if (onChange) {
                                  const updated = data || []
                                  const join = updated[idx]
                                  join.on[onIdx] = {
                                    ...join.on[onIdx],
                                    tableColumn: value,
                                  }
                                  onChange([...updated])
                                }
                              }}
                              placeholder={String(
                                t('datasets.sql-builder.fieldPlaceholder', 'таблица.колонка')
                              )}
                            />
                          </div>

                          <Select
                            value={on.operator}
                            onValueChange={(v) => {
                              if (onChange) {
                                const updated = data || []
                                const join = updated[idx]
                                join.on[onIdx] = {
                                  ...join.on[onIdx],
                                  operator: v as JoinItem['on'][number]['operator'],
                                }
                                onChange([...updated])
                              }
                            }}
                          >
                            <SelectTrigger
                              className="h-8 min-w-20"
                              title={String(t('datasets.sql-builder.operatorTitle', 'Оператор'))}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {operators.map((op) => (
                                <SelectItem key={op} value={op}>
                                  {op}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex-1 min-w-[220px]">
                            <Autocomplete
                              suggestions={(columnsMap?.[baseTable || ''] || []).map(
                                (c) => `${baseAlias || baseTable}.${c}`
                              )}
                              value={on.aliasColumn}
                              onValueChange={(value) => {
                                if (onChange) {
                                  const updated = data || []
                                  const join = updated[idx]
                                  join.on[onIdx] = {
                                    ...join.on[onIdx],
                                    aliasColumn: value,
                                  }
                                  onChange([...updated])
                                }
                              }}
                              placeholder={String(
                                t('datasets.sql-builder.aliasFieldPlaceholder', 'алиас.колонка')
                              )}
                            />
                          </div>

                          <Button
                            variant="secondary"
                            className="h-8"
                            onClick={() => {
                              if (onChange) {
                                const updated = data || []
                                updated[idx].on = updated[idx].on.filter((_, i) => i !== onIdx)
                                onChange([...updated])
                              }
                            }}
                          >
                            <TrashIcon className="size-4" />
                            {String(t('datasets.sql-builder.deleteBtnName', 'Удалить'))}
                          </Button>
                        </div>
                      </Item>
                    )
                  })}
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      if (onChange) {
                        const updated = data || []
                        const join = updated[idx]
                        const nextCond: JoinItem['on'][number] = {
                          tableColumn: '',
                          aliasColumn: '',
                          operator: '=',
                          cond: (join.on.length > 0 ? 'and' : undefined) as any,
                        }
                        join.on = [...join.on, nextCond]
                        onChange([...updated])
                      }
                    }}
                  >
                    <PlusIcon />{' '}
                    {String(t('datasets.sql-builder.join.addCondBtnName', 'Добавить условие'))}
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
                    <TrashIcon />{' '}
                    {String(t('datasets.sql-builder.join.deleteJoinBtnName', 'Удалить связь'))}
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
          <PlusIcon /> {String(t('datasets.sql-builder.join.addJoinBtnName', 'Добавить связь'))}
        </Button>
      </div>
    </div>
  )
}

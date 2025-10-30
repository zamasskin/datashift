export type MergeOn = {
  tableColumn: string
  aliasColumn: string
  operator: '=' | '!=' | '<' | '<=' | '>' | '>='
  cond?: 'and' | 'or'
}

export type MergeConfig = {
  type: 'merge'
  id: string
  params: {
    datasetLeftId: string
    datasetRightId: string
    on: MergeOn[]
  }
}

export type MergeDatasetType = {
  children?: React.ReactNode
  saveBtnName?: string
  config?: MergeConfig
  datasetsColumns?: Record<string, string[]>
  isLoading?: boolean
  onSave?: (config: MergeConfig) => void
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Item, ItemContent } from '~/components/ui/item'
import { Field, FieldLabel } from '~/components/ui/field'
import { Autocomplete } from '~/components/ui/autocomplete'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { ScrollArea } from '~/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'

export function MergeDataset(props: MergeDatasetType) {
  const operators = ['=', '!=', '<', '<=', '>', '>='] as const
  const conds = ['and', 'or'] as const

  const datasets = useMemo(() => Object.keys(props.datasetsColumns || {}), [props.datasetsColumns])

  const [open, setOpen] = useState(false)
  const initialConfig = props.config
  const [id] = useState(initialConfig?.id || `merge-${Date.now()}`)
  const [datasetLeftId, setDatasetLeftId] = useState(initialConfig?.params?.datasetLeftId || '')
  const [datasetRightId, setDatasetRightId] = useState(initialConfig?.params?.datasetRightId || '')
  const [rules, setRules] = useState<MergeOn[]>(
    initialConfig?.params?.on?.length
      ? initialConfig.params.on
      : [{ tableColumn: '', aliasColumn: '', operator: '=' }]
  )

  const bottomRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [rules.length])

  const canSave = useMemo(() => {
    if (!datasetLeftId.trim() || !datasetRightId.trim()) return false
    if (rules.length === 0) return false
    return rules.every((r) => r.tableColumn.trim() && r.aliasColumn.trim())
  }, [datasetLeftId, datasetRightId, rules])

  const handleSave = () => {
    const config: MergeConfig = {
      type: 'merge',
      id,
      params: {
        datasetLeftId: datasetLeftId.trim(),
        datasetRightId: datasetRightId.trim(),
        on: rules.map((r) => ({
          tableColumn: r.tableColumn.trim(),
          aliasColumn: r.aliasColumn.trim(),
          operator: r.operator,
          cond: r.cond,
        })),
      },
    }
    props.onSave?.(config)
  }

  const suggestionsLeft = useMemo(
    () => (props.datasetsColumns?.[datasetLeftId] || []).map((c) => `${datasetLeftId}.${c}`),
    [props.datasetsColumns, datasetLeftId]
  )
  const suggestionsRight = useMemo(
    () => (props.datasetsColumns?.[datasetRightId] || []).map((c) => `${datasetRightId}.${c}`),
    [props.datasetsColumns, datasetRightId]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[85vh] overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>Объединение</DialogTitle>
          <DialogDescription>
            Укажите датасеты, которые нужно объединить по заданным правилам соответствия полей.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Выбор датасетов */}
          <Item variant="outline">
            <ItemContent>
              <div className="grid md:grid-cols-2 gap-2">
                <Field>
                  <FieldLabel>Левый датасет</FieldLabel>
                  <Select value={datasetLeftId} onValueChange={setDatasetLeftId}>
                    <SelectTrigger className="min-w-40 h-8" title="Левый датасет">
                      <SelectValue placeholder="Выберите датасет" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Правый датасет</FieldLabel>
                  <Select value={datasetRightId} onValueChange={setDatasetRightId}>
                    <SelectTrigger className="min-w-40 h-8" title="Правый датасет">
                      <SelectValue placeholder="Выберите датасет" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </ItemContent>
          </Item>

          {/* Правила соответствия полей */}
          <div className="space-y-2">
            <ScrollArea className="max-h-72 max-w-full overflow-scroll">
              <div className="space-y-2">
                {rules.map((rule, idx) => (
                  <Item key={idx} variant="outline">
                    <ItemContent>
                      <div className="grid md:grid-cols-[1fr_min-content_1fr_min-content] gap-2 items-center">
                        <Autocomplete
                          suggestions={suggestionsLeft}
                          value={rule.tableColumn}
                          onValueChange={(value) => {
                            const next = [...rules]
                            next[idx] = { ...next[idx], tableColumn: value }
                            setRules(next)
                          }}
                          placeholder="поле слева (например: users.id)"
                        />

                        <Select
                          value={rule.operator}
                          onValueChange={(v) => {
                            const next = [...rules]
                            next[idx] = {
                              ...next[idx],
                              operator: v as (typeof operators)[number],
                            }
                            setRules(next)
                          }}
                        >
                          <SelectTrigger className="min-w-24 h-8" title="Оператор">
                            <SelectValue placeholder="оператор" />
                          </SelectTrigger>
                          <SelectContent>
                            {operators.map((op) => (
                              <SelectItem key={op} value={op}>
                                {op}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Autocomplete
                          suggestions={suggestionsRight}
                          value={rule.aliasColumn}
                          onValueChange={(value) => {
                            const next = [...rules]
                            next[idx] = { ...next[idx], aliasColumn: value }
                            setRules(next)
                          }}
                          placeholder="поле справа (например: orders.user_id)"
                        />

                        <div className="flex items-center gap-2">
                          <Select
                            value={rule.cond || 'and'}
                            onValueChange={(v) => {
                              const next = [...rules]
                              next[idx] = {
                                ...next[idx],
                                cond: v as (typeof conds)[number],
                              }
                              setRules(next)
                            }}
                          >
                            <SelectTrigger className="min-w-24 h-8" title="Связка">
                              <SelectValue placeholder="and/or" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="and">AND</SelectItem>
                              <SelectItem value="or">OR</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Удалить правило"
                            onClick={() => {
                              const next = rules.filter((_, i) => i !== idx)
                              setRules(next)
                            }}
                          >
                            <TrashIcon />
                          </Button>
                        </div>
                      </div>
                    </ItemContent>
                  </Item>
                ))}

                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRules([...rules, { tableColumn: '', aliasColumn: '', operator: '=' }])
              }}
            >
              <PlusIcon /> Добавить правило
            </Button>
          </div>

          {/* Действия */}
          <div className="flex gap-2">
            <Button disabled={!canSave || props.isLoading} onClick={handleSave}>
              {props.saveBtnName || 'Сохранить'}
            </Button>
            {props.children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

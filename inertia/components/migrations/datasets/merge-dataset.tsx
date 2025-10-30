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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'

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

export type DatasetConfig = {
  id: string
  title: string
  columns: string[]
}

export type MergeDatasetProps = {
  children?: React.ReactNode
  saveBtnName?: string
  config?: MergeConfig
  datasetsConfigs?: DatasetConfig[]
  isLoading?: boolean
  onSave?: (config: MergeConfig) => void
}

export function MergeDataset(props: MergeDatasetProps) {
  const operators = ['=', '!=', '<', '<=', '>', '>='] as const
  const conds = ['and', 'or'] as const

  const datasets = useMemo(
    () => (props.datasetsConfigs || []).map((dc) => dc.id),
    [props.datasetsConfigs]
  )

  const datasetTitleMap = useMemo(
    () =>
      Object.fromEntries(
        (props.datasetsConfigs || []).map((dc) => [
          dc.id,
          dc.title ? `${dc.title} (${dc.id})` : dc.id,
        ])
      ),
    [props.datasetsConfigs]
  )

  const [open, setOpen] = useState(false)
  const initialConfig = props.config
  const [datasetLeftId, setDatasetLeftId] = useState(initialConfig?.params?.datasetLeftId || '')
  const [datasetRightId, setDatasetRightId] = useState(initialConfig?.params?.datasetRightId || '')
  const [rules, setRules] = useState<MergeOn[]>(
    initialConfig?.params?.on?.length ? initialConfig.params.on : []
  )

  useEffect(() => {
    setDatasetLeftId(initialConfig?.params?.datasetLeftId || '')
  }, [initialConfig?.params?.datasetLeftId])

  useEffect(() => {
    setDatasetRightId(initialConfig?.params?.datasetRightId || '')
  }, [initialConfig?.params?.datasetRightId])

  useEffect(() => {
    setRules(initialConfig?.params?.on?.length ? initialConfig.params.on : [])
  }, [initialConfig?.params?.on])

  const bottomRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [rules.length])

  const handleSave = () => {
    if (props.onSave) {
      const params = {
        datasetLeftId: datasetLeftId.trim(),
        datasetRightId: datasetRightId.trim(),
        on: rules.map((r) => ({
          tableColumn: r.tableColumn.trim(),
          aliasColumn: r.aliasColumn.trim(),
          operator: r.operator,
          cond: r.cond,
        })),
      }

      if (props.config) {
        props.onSave({
          ...props.config,
          params,
        })
      } else {
        setDatasetLeftId('')
        setDatasetRightId('')
        setRules([])
        props.onSave({ type: 'merge', id: Date.now().toString(36), params })
      }
    }

    setOpen(false)
  }

  const suggestionsCombined = useMemo(() => {
    const leftCfg = (props.datasetsConfigs || []).find((dc) => dc.id === datasetLeftId)
    const rightCfg = (props.datasetsConfigs || []).find((dc) => dc.id === datasetRightId)
    const left = (leftCfg?.columns || []).map((c) => `${datasetLeftId}.${c}`)
    const right = (rightCfg?.columns || []).map((c) => `${datasetRightId}.${c}`)
    const merged = [...left, ...right].filter((s) => s && !s.startsWith('.'))
    return Array.from(new Set(merged))
  }, [props.datasetsConfigs, datasetLeftId, datasetRightId])

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
                      {datasets.length > 0 ? (
                        datasets.map((s) => (
                          <SelectItem key={s} value={s}>
                            {datasetTitleMap[s] || s}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Нет вариантов
                        </SelectItem>
                      )}
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
                      {datasets.length > 0 ? (
                        datasets.map((s) => (
                          <SelectItem key={s} value={s}>
                            {datasetTitleMap[s] || s}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Нет вариантов
                        </SelectItem>
                      )}
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
                          suggestions={suggestionsCombined}
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
                          suggestions={suggestionsCombined}
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
            <DialogClose asChild>
              <Button variant="outline">Закрыть</Button>
            </DialogClose>
            <Button onClick={handleSave}>{props.saveBtnName || 'Сохранить'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

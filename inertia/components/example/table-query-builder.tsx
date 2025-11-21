import { useState } from 'react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { IconPlayerPlay } from '@tabler/icons-react'
import { IconTrash } from '@tabler/icons-react'
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { DataSourceOption, DataSourceSelect } from './data-source-select'
import { ParamsEditor, ParamItem } from './params-editor'
import { ResultTable } from './result-table'
import { useI18n } from '~/hooks/useI18nLocal'

type Filter = { column: string; operator: string; value: string }
type Join = { type: 'inner' | 'left' | 'right'; table: string; onLeft: string; onRight: string }

export function TableQueryBuilder({
  dataSources,
  tables = [],
  result,
  onApply,
  onRemove,
}: {
  dataSources: DataSourceOption[]
  tables?: string[]
  result?: { rows: Array<Record<string, any>>; columns?: string[]; loading?: boolean }
  onApply?: (payload: {
    dataSourceId: number | null
    table: string | null
    filters: Filter[]
    joins: Join[]
    groupBy: string[]
    params: ParamItem[]
  }) => void
  onRemove?: () => void
}) {
  const { t } = useI18n()
  const [dataSourceId, setDataSourceId] = useState<number | null>(null)
  const [table, setTable] = useState<string | null>(tables[0] || null)
  const [filters, setFilters] = useState<Filter[]>([])
  const [joins, setJoins] = useState<Join[]>([])
  const [groupBy, setGroupBy] = useState<string[]>([])
  const [params, setParams] = useState<ParamItem[]>([])

  const addFilter = () => setFilters([...filters, { column: '', operator: '=', value: '' }])
  const removeFilter = (idx: number) => setFilters(filters.filter((_, i) => i !== idx))
  const patchFilter = (idx: number, patch: Partial<Filter>) => {
    const next = filters.slice()
    next[idx] = { ...next[idx], ...patch }
    setFilters(next)
  }

  const addJoin = () =>
    setJoins([...joins, { type: 'inner', table: tables[0] || '', onLeft: '', onRight: '' }])
  const removeJoin = (idx: number) => setJoins(joins.filter((_, i) => i !== idx))
  const patchJoin = (idx: number, patch: Partial<Join>) => {
    const next = joins.slice()
    next[idx] = { ...next[idx], ...patch }
    setJoins(next)
  }

  const addGroup = () => setGroupBy([...groupBy, ''])
  const removeGroup = (idx: number) => setGroupBy(groupBy.filter((_, i) => i !== idx))
  const patchGroup = (idx: number, value: string) => {
    const next = groupBy.slice()
    next[idx] = value
    setGroupBy(next)
  }

  const operators = ['=', '!=', '>', '>=', '<', '<=', 'LIKE', 'IN']

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {t('example.table-query-builder.card.title', 'Выбор подключения и таблицы')}
          </CardTitle>
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={t('example.table-query-builder.applyBtnName', 'Перевыполнить')}
              onClick={() =>
                onApply?.({
                  dataSourceId,
                  table,
                  filters,
                  joins,
                  groupBy,
                  params,
                })
              }
            >
              <IconPlayerPlay />
              <span className="sr-only">
                {t('example.table-query-builder.applyBtnName', 'Перевыполнить')}
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={t('example.table-query-builder.deleteBtnName', 'Удалить блок')}
              onClick={() => onRemove?.()}
            >
              <IconTrash />
              <span className="sr-only">
                {t('example.table-query-builder.deleteBtnName', 'Удалить блок')}
              </span>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4 ">
          <DataSourceSelect options={dataSources} value={dataSourceId} onChange={setDataSourceId} />

          <Field>
            <FieldLabel>{t('example.table-query-builder.tableLabel', 'Таблица')}</FieldLabel>
            <Select value={table ?? undefined} onValueChange={(v) => setTable(v)}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t(
                    'example.table-query-builder.tableSelect.placeholder',
                    'Выберите таблицу'
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {tables.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <FieldGroup>
            <Field>
              <FieldLabel>{t('example.table-query-builder.filters.label', 'Фильтры')}</FieldLabel>
              {filters.map((f, idx) => (
                <div key={idx} className="mb-2 flex gap-2">
                  <Input
                    placeholder={t(
                      'example.table-query-builder.filters.columnPlaceholder',
                      'колонка'
                    )}
                    value={f.column}
                    onChange={(e) => patchFilter(idx, { column: e.target.value })}
                  />
                  <Select
                    value={f.operator}
                    onValueChange={(v) => patchFilter(idx, { operator: v })}
                  >
                    <SelectTrigger>
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
                  <Input
                    placeholder={t(
                      'example.table-query-builder.filters.valuePlaceholder',
                      'значение'
                    )}
                    value={f.value}
                    onChange={(e) => patchFilter(idx, { value: e.target.value })}
                  />
                  <Button type="button" variant="secondary" onClick={() => removeFilter(idx)}>
                    {t('example.table-query-builder.deleteBtnName', 'Удалить')}
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addFilter}>
                {t('example.table-query-builder.filters.addBtnName', 'Добавить фильтр')}
              </Button>
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel>{t('example.table-query-builder.join.label', 'Связи (JOIN)')}</FieldLabel>
            {joins.map((j, idx) => (
              <div key={idx} className="mb-2 flex flex-wrap gap-2">
                <Select
                  value={j.type}
                  onValueChange={(v) => patchJoin(idx, { type: v as Join['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['inner', 'left', 'right'].map((jt) => (
                      <SelectItem key={jt} value={jt}>
                        {jt === 'inner'
                          ? t('example.table-query-builder.join.innerLabel', 'INNER JOIN')
                          : jt === 'left'
                            ? t('example.table-query-builder.join.leftLabel', 'LEFT JOIN')
                            : t('example.table-query-builder.join.rightLabel', 'RIGHT JOIN')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={j.table} onValueChange={(v) => patchJoin(idx, { table: v })}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        'example.table-query-builder.join.tablePlaceholder',
                        'таблица'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder={t(
                    'example.table-query-builder.join.on.leftPlaceholder',
                    'on: левая колонка'
                  )}
                  value={j.onLeft}
                  onChange={(e) => patchJoin(idx, { onLeft: e.target.value })}
                />
                <Input
                  placeholder={t(
                    'example.table-query-builder.join.on.rightPlaceholder',
                    'on: правая колонка'
                  )}
                  value={j.onRight}
                  onChange={(e) => patchJoin(idx, { onRight: e.target.value })}
                />
                <Button type="button" variant="secondary" onClick={() => removeJoin(idx)}>
                  {t('example.table-query-builder.deleteBtnName', 'Удалить')}
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addJoin}>
              {t('example.table-query-builder.join.addJoinBtnName', 'Добавить связь')}
            </Button>
          </Field>

          <Field>
            <FieldLabel>{t('example.table-query-builder.group.label', 'Группировка')}</FieldLabel>
            {groupBy.map((g, idx) => (
              <div key={idx} className="mb-2 flex gap-2">
                <Input
                  placeholder={t('example.table-query-builder.group.fieldPlaceholder', 'колонка')}
                  value={g}
                  onChange={(e) => patchGroup(idx, e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={() => removeGroup(idx)}>
                  {t('example.table-query-builder.deleteBtnName', 'Удалить')}
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addGroup}>
              {t('example.table-query-builder.group.addGroupBtnName', 'Добавить группировку')}
            </Button>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <ParamsEditor value={params} onChange={setParams} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <ResultTable
            rows={result?.rows ?? []}
            columns={result?.columns}
            loading={result?.loading}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => onApply?.({ dataSourceId, table, filters, joins, groupBy, params })}
        >
          Применить
        </Button>
      </div>
    </div>
  )
}

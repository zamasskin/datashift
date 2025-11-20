import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  ItemFooter,
} from '~/components/ui/item'
import { SqlBuilderDataset } from '../datasets/sql-builder-dataset'
import { Button } from '~/components/ui/button'
import { ChevronLeft, ChevronRight, Settings, Trash } from 'lucide-react'
import { SqlBuilderConfig } from '#interfaces/sql_builder_config'

export interface SqlBuilderCardProps {
  config?: SqlBuilderConfig
  suggestions?: Record<string, string[]>
  isLoading?: boolean
  onSave?: (config: SqlBuilderConfig) => void
  onRemove?: (id: string) => void
  page?: number
  onChangePage?: (page: number) => void
}

export function SqlBuilderCard({
  config,
  suggestions,
  isLoading,
  onSave,
  onRemove,
  page = 1,
  onChangePage,
}: SqlBuilderCardProps) {
  const formatJoinOn = (
    on?: { tableColumn: string; aliasColumn: string; operator: string; cond?: 'and' | 'or' }[]
  ) => {
    if (!on || on.length === 0) return ''
    return on
      .map((o, i) => {
        const cond = i > 0 && o.cond ? ` ${o.cond.toUpperCase()} ` : i > 0 ? ' AND ' : ''
        return `${cond}${o.tableColumn} ${o.operator} ${o.aliasColumn}`
      })
      .join('')
  }

  const formatSqlValue = (v: any): string => {
    if (v === null || v === undefined) return 'NULL'
    if (typeof v === 'string') return `'${v}'`
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
    return String(v)
  }

  const formatWhereFields = (
    fields?: { key: string; value?: any; values?: any[]; op?: string }[]
  ) => {
    if (!fields || fields.length === 0) return []
    return fields.map((f) => {
      const opStr = (f.op || '=').toLowerCase()
      if ((opStr === 'in' || opStr === 'nin') && Array.isArray(f.values)) {
        const inList = `(${f.values.map((v) => formatSqlValue(v)).join(', ')})`
        const opLabel = opStr === 'in' ? 'IN' : 'NOT IN'
        return `${f.key} ${opLabel} ${inList}`
      }
      const valueStr = f.value !== undefined ? formatSqlValue(f.value) : 'NULL'
      const opLabel =
        opStr === 'in' ? 'IN' : opStr === 'nin' ? 'NOT IN' : (f.op || '=').toUpperCase()
      return `${f.key} ${opLabel} ${valueStr}`
    })
  }

  const hasWhereContent = (data?: {
    fields?: { key: string; value?: any; values?: any[]; op?: string }[]
    $and?: Record<string, any>
    $or?: Record<string, any>
  }) => {
    if (!data) return false
    const hasFields = !!(data.fields && data.fields.length > 0)
    const hasAnd = !!(data.$and && Object.keys(data.$and).length > 0)
    const hasOr = !!(data.$or && Object.keys(data.$or).length > 0)
    return hasFields || hasAnd || hasOr
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove(config?.id || '')
    }
  }

  const compactList = (items?: string[], limit = 3): string => {
    const arr = items ?? []
    if (arr.length === 0) return ''
    if (arr.length <= limit) return arr.join(', ')
    const head = arr.slice(0, limit).join(', ')
    const rest = arr.length - limit
    return `${head} (+${rest})`
  }

  const renderSelectsSummary = (selects?: string[], limit = 3): string => {
    return compactList(selects, limit)
  }

  const renderGroupSummary = (group?: string[], limit = 3): string => {
    return compactList(group, limit)
  }

  const renderOrdersSummary = (
    orders?: Record<string, 'asc' | 'desc'>[],
    limit = 3
  ): string => {
    const list = (orders ?? []).flatMap((o) =>
      Object.entries(o).map(([col, dir]) => `${col} ${dir.toUpperCase()}`)
    )
    return compactList(list, limit)
  }

  const renderJoinsSummary = (
    joins?: { table: string; alias?: string; type: 'inner' | 'left' | 'right' | 'full' }[],
    limit = 2
  ): string => {
    const list = (joins ?? []).map((j) =>
      `${j.type.toUpperCase()} ${j.table}${j.alias ? ` (${j.alias})` : ''}`
    )
    return compactList(list, limit)
  }

  return (
    <div className="relative">
      <Item
        variant="outline"
        className={`relative rounded-md bg-card shadow-sm transition hover:shadow-md ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <ItemMedia>
          <img
            src="/icons/sql-build.png"
            alt={config?.id}
            width={32}
            height={32}
            className="object-cover grayscale rounded-sm"
          />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">
            Редактор запроса - <span className="text-muted-foreground">{config?.id}</span>
          </ItemTitle>
          <ItemDescription>
            <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs text-muted-foreground">
              Источник данных № {config?.params?.sourceId}
            </span>
          </ItemDescription>
          <ItemDescription>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>
                Таблица: <span className="font-medium">{config?.params?.table}</span>{' '}
                {config?.params?.alias && (
                  <>
                    AS <span className="font-medium">{config?.params?.alias}</span>
                  </>
                )}
              </div>
              {config?.params?.selects?.length ? (
                <div>· Поля: {renderSelectsSummary(config?.params?.selects)}</div>
              ) : null}
              {config?.params?.joins?.length ? (
                <div>· Join: {renderJoinsSummary(config?.params?.joins)}</div>
              ) : null}
              {config?.params?.orders?.length ? (
                <div>· Сортировки: {renderOrdersSummary(config?.params?.orders)}</div>
              ) : null}
              {config?.params?.group?.length ? (
                <div>· Группировок: {renderGroupSummary(config?.params?.group)}</div>
              ) : null}
            </div>
          </ItemDescription>
        </ItemContent>
        {config?.params && (
          <ItemContent>
            <ItemDescription>
              <div className="space-y-2 text-xs text-muted-foreground">
                {config.params.selects && config.params.selects.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Поля:</span>{' '}
                    <span className="inline-flex flex-wrap gap-1 align-middle">
                      {config.params.selects.map((s) => (
                        <span key={s} className="rounded border px-1 py-0.5">
                          {s}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {config.params.joins && config.params.joins.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Join:</span>
                    <div className="mt-1 space-y-1">
                      {config.params.joins.map((j, idx) => (
                        <div key={`${j.table}-${idx}`} className="rounded border px-2 py-1">
                          <span className="text-foreground">
                            {j.type.toUpperCase()} {j.table}
                            {j.alias ? ` AS ${j.alias}` : ''}
                          </span>
                          {j.on && j.on.length > 0 && (
                            <div className="mt-0.5">
                              <span className="text-foreground">ON</span>{' '}
                              <span>{formatJoinOn(j.on)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasWhereContent(config.params.where) && (
                  <div>
                    <span className="font-medium text-foreground">Фильтры WHERE:</span>
                    <div className="mt-1 inline-flex flex-wrap gap-1">
                      {formatWhereFields(config.params.where?.fields).map((w, i) => (
                        <code
                          key={`where-${i}`}
                          className="rounded bg-muted px-1 py-0.5 font-mono text-foreground"
                        >
                          {w}
                        </code>
                      ))}
                      {config.params.where?.$and &&
                        Object.entries(config.params.where?.$and ?? {}).map(([k, v], i) => (
                          <code
                            key={`where-and-${k}-${i}`}
                            className="rounded bg-muted px-1 py-0.5 font-mono text-foreground"
                          >
                            $and {k} = {formatSqlValue(v)}
                          </code>
                        ))}
                      {config.params.where?.$or &&
                        Object.entries(config.params.where?.$or ?? {}).map(([k, v], i) => (
                          <code
                            key={`where-or-${k}-${i}`}
                            className="rounded bg-muted px-1 py-0.5 font-mono text-foreground"
                          >
                            $or {k} = {formatSqlValue(v)}
                          </code>
                        ))}
                    </div>
                  </div>
                )}
                {hasWhereContent(config.params.hawing) && (
                  <div>
                    <span className="font-medium text-foreground">Фильтры HAVING:</span>
                    <div className="mt-1 inline-flex flex-wrap gap-1">
                      {formatWhereFields(config.params.hawing?.fields).map((h, i) => (
                        <code
                          key={`having-${i}`}
                          className="rounded bg-muted px-1 py-0.5 font-mono text-foreground"
                        >
                          {h}
                        </code>
                      ))}
                      {config.params.hawing?.$and &&
                        Object.entries(config.params.hawing?.$and ?? {}).map(([k, v], i) => (
                          <code
                            key={`having-and-${k}-${i}`}
                            className="rounded bg-muted px-1 py-0.5 font-mono text-foreground"
                          >
                            $and {k} = {formatSqlValue(v)}
                          </code>
                        ))}
                      {config.params.hawing?.$or &&
                        Object.entries(config.params.hawing?.$or ?? {}).map(([k, v], i) => (
                          <code
                            key={`having-or-${k}-${i}`}
                            className="rounded bg-muted px-1 py-0.5 font-mono text-foreground"
                          >
                            $or {k} = {formatSqlValue(v)}
                          </code>
                        ))}
                    </div>
                  </div>
                )}
                {config.params.group && config.params.group.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Группировки:</span>{' '}
                    <span className="inline-flex flex-wrap gap-1">
                      {config.params.group.map((g) => (
                        <span key={g} className="rounded border px-1 py-0.5">
                          {g}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {config.params.orders && config.params.orders.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Сортировки:</span>
                    <div className="mt-1 inline-flex flex-wrap gap-1">
                      {config.params.orders.flatMap((o, oi) =>
                        Object.entries(o).map(([col, dir]) => (
                          <span key={`${col}-${oi}`} className="rounded border px-1 py-0.5">
                            {col} {dir}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ItemDescription>
          </ItemContent>
        )}
        <ItemFooter>
          <div className="flex items-center gap-2">
            <Button
              aria-label="Предыдущая страница"
              size="icon"
              variant="ghost"
              disabled={isLoading || (page || 1) <= 1}
              onClick={() => onChangePage && onChangePage(Math.max(1, (page || 1) - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">Стр. {page || 1}</span>
            <Button
              aria-label="Следующая страница"
              size="icon"
              variant="ghost"
              disabled={isLoading}
              onClick={() => onChangePage && onChangePage((page || 1) + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button aria-label="Удалить" size="icon" variant="outline" onClick={handleRemove}>
              <Trash className="h-4 w-4" />
            </Button>
            <SqlBuilderDataset
              isLoading={isLoading}
              suggestions={suggestions}
              onSave={onSave}
              saveBtnName="Сохранить"
              config={config}
            >
              <Button aria-label="Настройки" size="icon" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </SqlBuilderDataset>
          </div>
        </ItemFooter>
      </Item>
    </div>
  )
}

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

  const renderOrdersSummary = (orders?: Record<string, 'asc' | 'desc'>[], limit = 3): string => {
    const list = (orders ?? []).flatMap((o) =>
      Object.entries(o).map(([col, dir]) => `${col} ${dir.toUpperCase()}`)
    )
    return compactList(list, limit)
  }

  const renderJoinsSummary = (
    joins?: { table: string; alias?: string; type: 'inner' | 'left' | 'right' | 'full' }[],
    limit = 2
  ): string => {
    const list = (joins ?? []).map(
      (j) => `${j.type.toUpperCase()} ${j.table}${j.alias ? ` (${j.alias})` : ''}`
    )
    return compactList(list, limit)
  }

  const renderWhereSummaryFull = (data?: {
    fields?: { key: string; value?: any; values?: any[]; op?: string }[]
    $and?: Record<string, any>
    $or?: Record<string, any>
  }): string => {
    if (!data) return ''
    const parts: string[] = []
    parts.push(...formatWhereFields(data.fields))
    if (data.$and) {
      for (const [k, v] of Object.entries(data.$and)) {
        parts.push(`$and ${k} = ${formatSqlValue(v)}`)
      }
    }
    if (data.$or) {
      for (const [k, v] of Object.entries(data.$or)) {
        parts.push(`$or ${k} = ${formatSqlValue(v)}`)
      }
    }
    return parts.join(', ')
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
          <ItemDescription className="line-clamp-none">
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
                <div>· Join: {renderJoinsSummary(config?.params?.joins, 9999)}</div>
              ) : null}
              {hasWhereContent(config?.params?.where) ? (
                <div>· WHERE: {renderWhereSummaryFull(config?.params?.where)}</div>
              ) : null}
              {hasWhereContent(config?.params?.hawing) ? (
                <div>· HAVING: {renderWhereSummaryFull(config?.params?.hawing)}</div>
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

import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, ItemFooter } from '~/components/ui/item'
import { Button } from '~/components/ui/button'
import { Settings, Trash } from 'lucide-react'
import { ModificationDataset } from '../datasets/modification-dataset'
import type { ModificationConfig, ColumnValue, NewColumnSpec } from '#interfaces/modification_config'

export type ModificationCardProps = {
  config?: ModificationConfig
  suggestions?: Record<string, string[]>
  isLoading?: boolean
  onRemove?: (id: string) => void
  onSave?: (config: ModificationConfig) => void
}

export function ModificationCard({
  config,
  suggestions,
  isLoading,
  onRemove,
  onSave,
}: ModificationCardProps) {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(config?.id || '')
    }
  }

  const formatLiteral = (val: any) => {
    if (val === null) return 'NULL'
    if (typeof val === 'string') return `'${val}'`
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
    return String(val)
  }

  const formatColumnValue = (cv: ColumnValue): string => {
    switch (cv.type) {
      case 'template':
        return `template \"${cv.value}\"`
      case 'expression':
        return `expr \"${cv.value}\"`
      case 'literal':
        return `literal ${formatLiteral(cv.value)}`
      case 'reference':
        return `ref ${cv.value}`
      case 'function':
        return `func ${cv.name}(${(cv.args || []).map(formatColumnValue).join(', ')})`
      default:
        return ''
    }
  }

  const renderNewColumnsSummary = (list?: NewColumnSpec[]) => {
    if (!list || list.length === 0) return ''
    return list
      .map((item) => {
        // Если нет поля type — это объект-обёртка { name?, value: ColumnValue }
        if (!('type' in item)) {
          const name = item.name ? `${item.name}: ` : ''
          return `${name}${formatColumnValue(item.value)}`
        }
        // Иначе это ColumnValue
        return formatColumnValue(item)
      })
      .join(', ')
  }

  const renderRenameSummary = (map?: Record<string, string>) => {
    if (!map) return ''
    const entries = Object.entries(map)
    if (entries.length === 0) return ''
    return entries.map(([from, to]) => `${from} → ${to}`).join(', ')
  }

  return (
    <Item variant="outline">
      <ItemMedia>
        <img
          src="/icons/modify.png"
          alt={config?.id}
          width={32}
          height={32}
          className="object-cover grayscale"
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="line-clamp-1">
          Модификация - <span className="text-muted-foreground">{config?.id}</span>
        </ItemTitle>
        <ItemDescription>Датасет № {config?.params?.datasetId}</ItemDescription>
        <ItemDescription className="line-clamp-none">
          <div className="text-xs text-muted-foreground space-y-0.5">
            {config?.params?.newColumns?.length ? (
              <div>· Новые колонки: {renderNewColumnsSummary(config?.params?.newColumns)}</div>
            ) : null}
            {config?.params?.dropColumns?.length ? (
              <div>· Удалить колонки: {config?.params?.dropColumns?.join(', ')}</div>
            ) : null}
            {config?.params?.renameColumns && Object.keys(config?.params?.renameColumns).length ? (
              <div>· Переименования: {renderRenameSummary(config?.params?.renameColumns)}</div>
            ) : null}
          </div>
        </ItemDescription>
      </ItemContent>
      <ItemFooter>
        <div className="flex items-center gap-2 ml-auto">
          <Button size="icon" variant="outline" onClick={handleRemove}>
            <Trash />
          </Button>
          <ModificationDataset
            saveBtnName="Сохранить"
            config={config}
            suggestions={suggestions}
            isLoading={isLoading}
            onSave={onSave}
          >
            <Button size="icon" variant="outline" aria-label="Редактировать">
              <Settings />
            </Button>
          </ModificationDataset>
        </div>
      </ItemFooter>
    </Item>
  )
}

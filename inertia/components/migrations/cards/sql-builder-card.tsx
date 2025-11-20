import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, ItemFooter } from '~/components/ui/item'
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
  const handleRemove = () => {
    if (onRemove) {
      onRemove(config?.id || '')
    }
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
            <span className="text-xs text-muted-foreground">
              Таблица: <span className="font-medium">{config?.params?.table}</span>
              {config?.params?.selects && config.params.selects.length > 0 && (
                <> · Поля: {config.params.selects.length}</>
              )}
              {config?.params?.joins && config.params.joins.length > 0 && (
                <> · Join: {config.params.joins.length}</>
              )}
              {config?.params?.orders && config.params.orders.length > 0 && (
                <> · Сортировок: {config.params.orders.length}</>
              )}
              {config?.params?.group && config.params.group.length > 0 && (
                <> · Группировок: {config.params.group.length}</>
              )}
            </span>
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

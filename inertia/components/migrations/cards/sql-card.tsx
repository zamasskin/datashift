import { ChevronLeft, ChevronRight, Settings, Trash } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, ItemFooter } from '~/components/ui/item'
import { SqlSnippet } from '~/components/ui/sql-snippet'
import { SqlDataset } from '../datasets/sql-dataset'
import { SqlConfig } from '#interfaces/sql_config'

export type SqlCardProps = {
  isLoading?: boolean
  config?: SqlConfig
  suggestions?: Record<string, string[]>
  page?: number
  onChangePage?: (page: number) => void

  onRemove?: (id: string) => void
  onUpdate?: (config: SqlConfig) => void
}

export function SqlCard({
  config,
  isLoading,
  suggestions,
  onRemove: onRemove,
  page = 1,
  onChangePage,
  onUpdate,
}: SqlCardProps) {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(config?.id || '')
    }
  }

  return (
    <div className="relative">
      <Item variant="outline" className={`relative rounded-md bg-card shadow-sm transition hover:shadow-md ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <ItemMedia>
          <img
            src="/icons/sql-edit.png"
            alt={config?.id}
            width={32}
            height={32}
            className="object-cover grayscale rounded-sm"
          />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">
            Sql запрос — <span className="text-muted-foreground">{config?.id}</span>
          </ItemTitle>
          <ItemDescription>
            <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs text-muted-foreground">
              Источник данных № {config?.params?.sourceId}
            </span>
          </ItemDescription>
          {config?.params?.query && (
            <ItemDescription>
              <SqlSnippet code={config.params.query} />
            </ItemDescription>
          )}
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

            <SqlDataset
              suggestions={suggestions}
              onSave={onUpdate}
              isLoading={isLoading}
              config={config}
              saveBtnName="Сохранить"
            >
              <Button aria-label="Настройки" size="icon" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </SqlDataset>
          </div>
        </ItemFooter>
      </Item>
    </div>
  )
}

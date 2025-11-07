import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '~/components/ui/item'
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
      <div className="ml-4 border-l border-r border-t border-border w-fit rounded-tl-sm rounded-tr-sm ">
        <Button
          size="sm"
          variant="link"
          disabled={isLoading || (page || 1) <= 1}
          onClick={() => onChangePage && onChangePage(Math.max(1, (page || 1) - 1))}
        >
          <ChevronLeft />
        </Button>
        <span className="text-sm text-muted-foreground">Стр. {page || 1}</span>
        <Button
          size="sm"
          variant="link"
          disabled={isLoading}
          onClick={() => onChangePage && onChangePage((page || 1) + 1)}
        >
          <ChevronRight />
        </Button>
      </div>

      <Item variant="outline" className="relative">
        <ItemMedia>
          <img
            src="/icons/sql-build.png"
            alt={config?.id}
            width={32}
            height={32}
            className="object-cover grayscale"
          />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">
            Редактор запроса - <span className="text-muted-foreground">{config?.id}</span>
          </ItemTitle>

          <ItemDescription>Источник данных № {config?.params?.sourceId}</ItemDescription>
        </ItemContent>
        <ItemContent className="flex-none text-center">
          <ItemDescription className="space-x-2">
            <Button size="icon" variant="outline" onClick={handleRemove}>
              <Trash />
            </Button>
            <SqlBuilderDataset
              isLoading={isLoading}
              suggestions={suggestions}
              onSave={onSave}
              saveBtnName="Сохранить"
              config={config}
            >
              <Button size="icon" variant="outline">
                <Settings />
              </Button>
            </SqlBuilderDataset>
          </ItemDescription>
        </ItemContent>
      </Item>
    </div>
  )
}

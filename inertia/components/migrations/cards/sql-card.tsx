import { ChevronLeft, ChevronRight, Settings, Trash } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from '~/components/ui/item'
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
      <div className="ml-4 border-l border-r border-t border-border w-fit rounded-tl-sm rounded-tr-sm">
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
      <Item variant="outline">
        <ItemMedia>
          <img
            src="/icons/sql-edit.png"
            alt={config?.id}
            width={32}
            height={32}
            className="object-cover grayscale"
          />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">
            Sql запрос - <span className="text-muted-foreground">{config?.id}</span>
          </ItemTitle>
          <ItemDescription>Источник данных № {config?.params?.sourceId}</ItemDescription>
        </ItemContent>
        <ItemContent>
          <ItemDescription className="space-x-2">
            <Button size="icon" variant="outline" onClick={handleRemove}>
              <Trash />
            </Button>

            <SqlDataset
              suggestions={suggestions}
              onSave={onUpdate}
              isLoading={isLoading}
              config={config}
              saveBtnName="Сохранить"
            >
              <Button size="icon" variant="outline">
                <Settings />
              </Button>
            </SqlDataset>
          </ItemDescription>
        </ItemContent>
      </Item>
    </div>
  )
}

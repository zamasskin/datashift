import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '~/components/ui/item'
import { SqlBuilderDataset } from '../datasets/sql-builder-dataset'
import { Button } from '~/components/ui/button'
import { Settings, Trash } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '~/components/ui/pagination'
import { SqlBuilderConfig } from '#interfaces/sql_builder_config'

export interface SqlBuilderCardProps {
  config?: SqlBuilderConfig
  suggestions?: string[]
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
    <Item variant="outline">
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
      <ItemFooter>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (!isLoading) {
                    onChangePage?.(Math.max(1, (page || 1) - 1))
                  }
                }}
                className={isLoading || (page || 1) <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {page || 1}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (!isLoading) {
                    onChangePage?.((page || 1) + 1)
                  }
                }}
                className={isLoading ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </ItemFooter>
    </Item>
  )
}

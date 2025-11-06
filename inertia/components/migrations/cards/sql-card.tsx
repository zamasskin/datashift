import { Settings, Trash } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from '~/components/ui/pagination'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '~/components/ui/item'
import { SqlDataset } from '../datasets/sql-dataset'
import { SqlConfig } from '#interfaces/sql_config'

export type SqlCardProps = {
  isLoading?: boolean
  paramKeys?: string[]
  config?: SqlConfig
  prevResults?: Record<string, string[]>
  page?: number
  totalPages?: number
  onChangePage?: (page: number) => void

  onRemove?: (id: string) => void
  onUpdate?: (config: SqlConfig) => void
}

export function SqlCard({
  config,
  paramKeys,
  prevResults,
  isLoading,
  onRemove: onRemove,
  page = 1,
  totalPages,
  onChangePage,
  onUpdate,
}: SqlCardProps) {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(config?.id || '')
    }
  }

  return (
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
            onSave={onUpdate}
            prevResults={prevResults}
            paramKeys={paramKeys}
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
      <ItemContent className="flex-none text-center">
        <ItemDescription className="space-x-2">
          {/* Preview-only pagination controls */}
        </ItemDescription>
      </ItemContent>
      <ItemFooter className="space-x-2">
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

            {typeof totalPages === 'number' && totalPages > 1 ? (
              <>
                {/* First page */}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive={(page || 1) === 1}
                    onClick={(e) => {
                      e.preventDefault()
                      onChangePage?.(1)
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>

                {/* Left ellipsis */}
                {(page || 1) - 2 > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Window around current */}
                {Array.from({ length: 5 }, (_, i) => (page || 1) - 2 + i)
                  .filter((p) => p > 1 && p < totalPages)
                  .map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={(page || 1) === p}
                        onClick={(e) => {
                          e.preventDefault()
                          onChangePage?.(p)
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                {/* Right ellipsis */}
                {(page || 1) + 2 < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Last page */}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive={(page || 1) === totalPages}
                    onClick={(e) => {
                      e.preventDefault()
                      onChangePage?.(totalPages)
                    }}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            ) : (
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {page || 1}
                </PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (!isLoading) {
                    const next = (page || 1) + 1
                    const capped =
                      typeof totalPages === 'number' ? Math.min(next, totalPages) : next
                    onChangePage?.(capped)
                  }
                }}
                className={
                  isLoading || (typeof totalPages === 'number' && (page || 1) >= totalPages)
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </ItemFooter>
    </Item>
  )
}

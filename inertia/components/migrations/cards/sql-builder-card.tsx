import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '~/components/ui/item'
import { SqlBuilderConfig, SqlBuilderDataset } from '../datasets/sql-builder-dataset'
import { Button } from '~/components/ui/button'
import { Settings, Trash } from 'lucide-react'

export interface SqlBuilderCardProps {
  config?: SqlBuilderConfig
  suggestions?: string[]
  isLoading?: boolean
  onSave?: (config: SqlBuilderConfig) => void
  onRemove?: (id: string) => void
}

export function SqlBuilderCard({
  config,
  suggestions,
  isLoading,
  onSave,
  onRemove,
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
    </Item>
  )
}

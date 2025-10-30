import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '~/components/ui/item'
import { DatasetConfig, MergeConfig, MergeDataset } from '../datasets/merge-dataset'
import { Button } from '~/components/ui/button'
import { Settings, Trash } from 'lucide-react'

export type MergeCardProps = {
  config?: MergeConfig
  datasetsConfigs?: DatasetConfig[]
  isLoading?: boolean
  onRemove?: (id: string) => void
  onSave?: (config: MergeConfig) => void
}
export function MergeCard({
  config,
  datasetsConfigs,
  isLoading,
  onRemove,
  onSave,
}: MergeCardProps) {
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
          Объединение - <span className="text-muted-foreground">{config?.id}</span>
        </ItemTitle>
        <ItemDescription>
          Объединение Датасета {config?.params.datasetLeftId} с {config?.params.datasetRightId}
        </ItemDescription>
      </ItemContent>
      <ItemContent className="flex-none text-center">
        <ItemDescription className="space-x-2">
          <Button size="icon" variant="outline" onClick={handleRemove}>
            <Trash />
          </Button>

          <MergeDataset
            saveBtnName="Сохранить"
            config={config}
            datasetsConfigs={datasetsConfigs}
            isLoading={isLoading}
            onSave={onSave}
          >
            <Button size="icon" variant="outline">
              <Settings />
            </Button>
          </MergeDataset>
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}

import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '~/components/ui/item'
import { Button } from '~/components/ui/button'
import { Settings, Trash } from 'lucide-react'
import { ModificationDataset, DatasetConfig } from '../datasets/modification-dataset'
import type { ModificationConfig } from '#interfaces/modification_config'

export type ModificationCardProps = {
  config?: ModificationConfig
  datasetsConfigs?: DatasetConfig[]
  isLoading?: boolean
  onRemove?: (id: string) => void
  onSave?: (config: ModificationConfig) => void
}

export function ModificationCard({
  config,
  datasetsConfigs,
  isLoading,
  onRemove,
  onSave,
}: ModificationCardProps) {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(config?.id || '')
    }
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
      </ItemContent>
      <ItemContent className="flex-none text-center">
        <ItemDescription className="space-x-2">
          <Button size="icon" variant="outline" onClick={handleRemove}>
            <Trash />
          </Button>

          <ModificationDataset
            saveBtnName="Сохранить"
            config={config}
            datasetsConfigs={datasetsConfigs}
            isLoading={isLoading}
            onSave={onSave}
          >
            <Button size="icon" variant="outline">
              <Settings />
            </Button>
          </ModificationDataset>
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}

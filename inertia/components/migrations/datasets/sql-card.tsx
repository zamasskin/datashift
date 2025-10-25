import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog'
import { Settings, Trash } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { DialogHeader } from '~/components/ui/dialog'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '~/components/ui/item'

export type Config = {
  type: 'sql'
  id: string
  params: {
    sourceId: number
    query: string
  }
}

export type SqlCardProps = {
  config?: Config

  onRemove?: (id: string) => void
  onUpdate?: (config: Config) => void
}

export function SqlCard({ config, onRemove: onRemove, onUpdate }: SqlCardProps) {
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
      <ItemContent className="flex-none text-center">
        <ItemDescription>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={handleRemove}>
              <Trash />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline">
                  <Settings />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your account and
                    remove your data from our servers.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}

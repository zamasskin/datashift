import { ColumnDef } from '@tanstack/react-table'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { Checkbox } from '~/components/ui/checkbox'
import DataSource from '#models/data_source'
import { typesIcon } from './config'
import { Avatar, AvatarImage } from '~/components/ui/avatar'
import { SourcesDelete } from './functions'

type SourcesMessages = {
  table?: {
    name?: string
    type?: string
    createdBy?: string
    createdAt?: string
    updatedAt?: string
    ariaSelectAll?: string
    ariaSelectRow?: string
  }
  actions?: {
    menuAria?: string
    label?: string
    edit?: string
    delete?: string
    confirmDelete?: string
  }
}

export type Sources = {
  id: number
  name: string
  type: 'mysql' | 'postgresql' | 'rest-api' | 'soap'
  connectionUrl: string
  createdBy: string
}

export const makeColumns = ({
  onEdit,
  messages,
}: {
  onEdit: (source: DataSource) => void
  messages: SourcesMessages
}): ColumnDef<DataSource>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={messages.table?.ariaSelectAll || 'Select all'}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={messages.table?.ariaSelectRow || 'Select row'}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{messages.actions?.menuAria || 'Open menu'}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{messages.actions?.label || 'Actions'}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil /> {messages.actions?.edit || 'Изменить'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                SourcesDelete(
                  [row.original.id],
                  messages.actions?.confirmDelete || 'Вы точно уверены?'
                )
              }
            >
              <Trash /> {messages.actions?.delete || 'Удалить'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: 'name',
    header: messages.table?.name || 'Имя',
  },
  {
    accessorKey: 'type',
    header: messages.table?.type || 'Тип',
    cell: ({ row }) => {
      const type = row.original.type
      const icon = typesIcon[type] || ''
      return (
        <div className="flex items-center gap-2">
          {icon && (
            <Avatar className="h-6 w-6 rounded-lg grayscale">
              <AvatarImage src={icon} />
            </Avatar>
          )}
          <span>{type}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdBy',
    header: messages.table?.createdBy || 'Создано пользователем',
    cell: ({ row }) => {
      return row.original.user.fullName
    },
  },
  {
    accessorKey: 'createdAtFormatted',
    header: messages.table?.createdAt || 'Дата создания',
  },
  {
    accessorKey: 'updatedAtFormatted',
    header: messages.table?.updatedAt || 'Дата обновления',
  },
]

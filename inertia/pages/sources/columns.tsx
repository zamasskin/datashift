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

export type Sources = {
  id: number
  name: string
  type: 'mysql' | 'postgresql' | 'rest-api' | 'soap'
  connectionUrl: string
  createdBy: string
}

export const makeColumns = ({
  onEdit,
}: {
  onEdit: (source: DataSource) => void
}): ColumnDef<DataSource>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
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
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil /> Изменить
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => SourcesDelete([row.original.id])}
            >
              <Trash /> Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: 'name',
    header: 'Имя',
  },
  {
    accessorKey: 'type',
    header: 'Тип',
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
    header: 'Создано пользователем',
    cell: ({ row }) => {
      return row.original.user.fullName
    },
  },
  {
    accessorKey: 'createdAtFormatted',
    header: 'Дата создания',
  },
  {
    accessorKey: 'updatedAtFormatted',
    header: 'Дата обновления',
  },
]

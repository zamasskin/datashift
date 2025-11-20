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

type TFunc = (key: string, fallback?: string) => string

export type Sources = {
  id: number
  name: string
  type: 'mysql' | 'postgresql' | 'rest-api' | 'soap'
  connectionUrl: string
  createdBy: string
}

export const makeColumns = ({
  onEdit,
  t,
}: {
  onEdit: (source: DataSource) => void
  t: TFunc
}): ColumnDef<DataSource>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={t('sources.table.ariaSelectAll', 'Select all')}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={t('sources.table.ariaSelectRow', 'Select row')}
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
              <span className="sr-only">{t('sources.actions.menuAria', 'Open menu')}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('sources.actions.label', 'Actions')}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil /> {t('sources.actions.edit', 'Изменить')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                SourcesDelete(
                  [row.original.id],
                  t('sources.actions.confirmDelete', 'Вы точно уверены?')
                )
              }
            >
              <Trash /> {t('sources.actions.delete', 'Удалить')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: 'name',
    header: t('sources.table.name', 'Имя'),
  },
  {
    accessorKey: 'type',
    header: t('sources.table.type', 'Тип'),
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
    header: t('sources.table.createdBy', 'Создано пользователем'),
    cell: ({ row }) => {
      return row.original.user.fullName
    },
  },
  {
    accessorKey: 'createdAtFormatted',
    header: t('sources.table.createdAt', 'Дата создания'),
  },
  {
    accessorKey: 'updatedAtFormatted',
    header: t('sources.table.updatedAt', 'Дата обновления'),
  },
]

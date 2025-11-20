import { flexRender, getCoreRowModel, useReactTable, VisibilityState } from '@tanstack/react-table'
import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Input } from '../../components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
} from '../../components/ui/dropdown-menu'
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { Button } from '../../components/ui/button'
import { IconChevronDown, IconLayoutColumns } from '@tabler/icons-react'
import { usePage } from '@inertiajs/react'
import DataSource from '#models/data_source'
import { makeColumns } from './columns'
import { CreateSource } from './new-source'
import { EditSource } from './edit-source'
import { SourcesDelete } from './functions'
import { useI18n } from '~/hooks/useI18nLocal'

export function DataTable() {
  const { props: pageProps } = usePage<{
    dataSources: DataSource[]
    csrfToken: string
    sourcesMessages?: any
  }>()
  const { t } = useI18n()

  const [findTimeout, setFindTimeout] = React.useState<NodeJS.Timeout | null>(null)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [data, setData] = React.useState<DataSource[]>(pageProps.dataSources)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Pick<
    DataSource,
    'id' | 'name' | 'type' | 'config'
  > | null>(null)

  // Синхронизируем состояние таблицы при обновлении props
  React.useEffect(() => {
    setData(pageProps.dataSources)
  }, [pageProps.dataSources])

  const columns = React.useMemo(
    () =>
      makeColumns({
        onEdit: (src) => {
          setEditing(src)
          setEditOpen(true)
        },
        t,
      }),
    [t]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
  })

  const onSelectedDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      alert(t('sources.selection.noneSelectedAlert', 'Выберите записи для удаления.'))
      return
    }

    const selectedIds = selectedRows.map((row) => row.original.id)
    SourcesDelete(selectedIds, t('sources.actions.confirmDelete', 'Вы точно уверены?'))
  }

  const onFindChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (findTimeout) clearTimeout(findTimeout)
    const timeout = setTimeout(() => {
      setData(
        pageProps.dataSources.filter(
          (item) => !value || item.name.toLocaleLowerCase().includes(value.toLocaleLowerCase())
        )
      )
    }, 300)
    setFindTimeout(timeout)
  }

  return (
    <>
      <div className="w-full flex-col justify-start gap-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <div className="flex items-center">
              <Input
                placeholder={t('sources.filter.searchPlaceholder', 'Поиск...')}
                onChange={onFindChange}
                className="max-w-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">
                    {t('sources.filter.columnsConfigure', 'Настроить столбцы')}
                  </span>
                  <span className="lg:hidden">{t('sources.filter.columnsShort', 'Столбцы')}</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) => typeof column.accessorFn !== 'undefined' && column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <CreateSource />
          </div>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t('sources.table.empty', 'Нет ни одного результата.')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <EditSource open={editOpen} onOpenChange={setEditOpen} source={editing} />
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            {table.getFilteredSelectedRowModel().rows.length} {t('sources.selection.of', 'из')}{' '}
            {table.getFilteredRowModel().rows.length}{' '}
            {t('sources.selection.suffix', 'записи(ей) выбрано.')}
          </div>
          <div className="space-x-2">
            <Button variant="destructive" size="sm" onClick={onSelectedDelete}>
              {t('sources.actions.bulkDelete', 'Удалить')}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

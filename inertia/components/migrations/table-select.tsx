import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Check, ChevronsUpDown } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { cn } from '~/lib/utils'

export type TableSelectProps = {
  tables?: string[]
  selectedTable?: string
  onSelectTable?: (table: string) => void
}

export function TableSelect({ tables = [], selectedTable, onSelectTable }: TableSelectProps) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedTable ? tables.find((table) => table === selectedTable) : 'Выберите таблицу...'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Поиск таблицы..." className="h-9" />
          <CommandList>
            <CommandEmpty>Таблицы не найдены.</CommandEmpty>
            <CommandGroup>
              {tables.map((table) => (
                <CommandItem
                  key={table}
                  value={table}
                  onSelect={(currentValue) => {
                    onSelectTable?.(currentValue || '')
                    setOpen(false)
                  }}
                >
                  {table}
                  <Check
                    className={cn('ml-auto', selectedTable === table ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

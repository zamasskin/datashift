"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "@inertiajs/react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "~/components/ui/command"
import { Kbd } from "~/components/ui/kbd"
import { Badge } from "~/components/ui/badge"
import { cn } from "~/lib/utils"
import {
  IconBrandCodepen,
  IconArrowUpToArc,
  IconSettings,
  IconHelp,
  IconSearch,
  IconUserCircle,
  IconAlertCircle,
} from "@tabler/icons-react"

type CommandLink = {
  label: string
  href: string
  icon?: React.ComponentType<any>
  shortcut?: string
  hint?: string
}

const navCommands: CommandLink[] = [
  { label: "Главная", href: "/", icon: IconSearch },
  { label: "Источники данных", href: "/sources", icon: IconBrandCodepen },
  { label: "Миграции", href: "/migrations", icon: IconArrowUpToArc },
  { label: "Ошибки", href: "/errors", icon: IconAlertCircle },
  { label: "Настройки", href: "/settings", icon: IconSettings },
  { label: "Профиль", href: "/profile", icon: IconUserCircle },
  { label: "Помощь", href: "/help", icon: IconHelp },
]

export function GlobalSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  // Toggle by keyboard: Cmd/Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Open via custom event from sidebar button
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("open-global-search", handler as EventListener)
    return () => window.removeEventListener("open-global-search", handler as EventListener)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return navCommands
    return navCommands.filter((c) => c.label.toLowerCase().includes(q))
  }, [query])

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className={cn("max-w-xl", className)}>
      <CommandInput placeholder="Введите команду или запрос..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Ничего не найдено</CommandEmpty>

        <CommandGroup heading="Навигация">
          {filtered.map((item) => (
            <CommandItem key={item.href} onSelect={() => setOpen(false)}>
              {item.icon && <item.icon className="size-4" />}
              <Link href={item.href} className="flex flex-1 items-center gap-2">
                <span>{item.label}</span>
                <Badge variant="outline" className="ml-auto">{item.href}</Badge>
              </Link>
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Подсказки">
          <CommandItem disabled>
            <IconSearch className="size-4" />
            <span>Откройте палитру</span>
            <div className="ml-auto flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export default GlobalSearch
import * as React from 'react'
import {
  IconBrandCodepen,
  IconTornado,
  IconArrowUpToArc,
  IconBrandAsana,
  IconSettings,
  IconHelp,
  IconSearch,
} from '@tabler/icons-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'
import { Link } from '@inertiajs/react'
import { NavMain } from './nav-main'
import { NavUser } from './user-naw'
import { NavSecondary } from './nav-secondary'
import { BrandMark } from '~/components/ui/brand-logo'
import { useMigrationRuns } from '~/store/migrations'
import { Progress } from './ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: 'https://github.com/shadcn.png',
  },
  navMain: [
    {
      title: '1 — Источники данных',
      url: '/sources',
      icon: IconBrandCodepen,
    },
    {
      title: '2 — Датасеты',
      url: '/datasets',
      icon: IconTornado,
    },
    {
      title: '3 — Миграции',
      url: '/migrations',
      icon: IconArrowUpToArc,
    },
    {
      title: '4 — Задания',
      url: '/tasks',
      icon: IconBrandAsana,
    },
  ],
  navSecondary: [
    {
      title: 'Настройки',
      url: '/settings',
      icon: IconSettings,
    },
    {
      title: 'Помощь',
      url: '/help',
      icon: IconHelp,
    },
    {
      title: 'Поиск',
      url: '#',
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { runnings } = useMigrationRuns()
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/" className="flex items-center gap-2">
                <div className="size-9 rounded-md grid place-items-center bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))]">
                  <BrandMark className="size-5 text-foreground/80" />
                </div>
                <span className="text-foreground text-xl font-semibold tracking-tight">
                  Datashift
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />

        {/* Индикаторы запущенных процессов */}
        {runnings.length > 0 && (
          <div className="mt-4 p-2 rounded-md border border-[hsl(var(--sidebar-border))]">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Запущено ({runnings.length})
            </div>
            <ul className="space-y-2">
              {runnings.map((r) => (
                <li key={r.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Link href={`/migrations/${r.migrationId}`} className="flex items-center gap-2">
                      <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm text-foreground">Миграция #{r.migrationId}</span>
                    </Link>
                    <span className="text-xs text-muted-foreground">{r.trigger}</span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer">
                        <Progress value={r.progress[0]} />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Прогресс</span>
                          <span className="text-xs text-foreground">{r.progress[0]}%</span>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent>
                      {r.progress.map((percent, idx) => (
                        <div key={idx} className="space-y-2">
                          <span className="text-xs text-muted-foreground">
                            {`Поток ${idx + 1}`}
                          </span>
                          <Progress value={percent} />
                          <span className="text-xs text-foreground">{`${percent}%`}</span>
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                </li>
              ))}
            </ul>
          </div>
        )}

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

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

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

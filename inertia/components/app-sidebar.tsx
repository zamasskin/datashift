import * as React from 'react'
import { IconSettings, IconHelp, IconSearch } from '@tabler/icons-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'
import { Link, usePage } from '@inertiajs/react'
import { NavMain } from './nav-main'
import { NavUser } from './user-naw'
import { NavSecondary } from './nav-secondary'
import { BrandMark } from '~/components/ui/brand-logo'
import { useMigrationRuns } from '~/store/migrations'
import { RunningIndicators } from './running-indicators'
import User from '#models/user'
import { ChevronRight, CloudFog, Plug } from 'lucide-react'

type LayoutMessages = {
  brand?: string
  root?: {
    nav?: { sources?: string; datasets?: string; migrations?: string; tasks?: string }
    createMenu?: { source?: string; dataset?: string; migration?: string; task?: string }
    settingsMenu?: {
      trigger?: string
      security?: string
      users?: string
      user?: string
      profile?: string
      logout?: string
    }
    secondary?: { help?: string; search?: string }
    running?: { showAll?: string }
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const page = usePage<{ user: User; layoutMessages: LayoutMessages }>()
  const isAdmin = page.props?.user?.role === 'admin'
  const lm = page.props?.layoutMessages || {}
  const navMain = [
    {
      title: lm.root?.nav?.migrations || 'Миграции',
      url: '/migrations',
      icon: <CloudFog />,
    },

    {
      title: lm.root?.nav?.sources || 'Подключения',
      url: '/sources',
      icon: <Plug />,
    },
  ]

  const navSecondary = [
    {
      title: lm.root?.secondary?.help || 'Помощь',
      url: '/help',
      icon: IconHelp,
    },
    {
      title: lm.root?.secondary?.search || 'Поиск',
      url: '#',
      icon: IconSearch,
    },
  ]

  const navSecondaryAdmin = [
    {
      title: lm.root?.settingsMenu?.trigger || 'Настройки',
      url: '/settings',
      icon: IconSettings,
    },
    ...navSecondary,
  ]

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
                  {lm.brand || 'Datashift'}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />

        {/* Индикаторы запущенных процессов */}
        {runnings.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent className="space-y-2">
              <RunningIndicators runnings={runnings.slice(0, 3)} />
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={lm.root?.running?.showAll || 'Показать все'} asChild>
                  <Link href="/tasks" className="flex items-center gap-2">
                    <ChevronRight />
                    <span>{lm.root?.running?.showAll || 'Показать все'}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <NavSecondary items={isAdmin ? navSecondaryAdmin : navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

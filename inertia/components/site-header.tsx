import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { ThemeToggle } from './theme-toggle'
import { NotificationsButton } from './errors/notifications-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { useEffect, useState } from 'react'

export function SiteHeader({ title }: { title: string }) {
  const [locale, setLocale] = useState<string | null>(null)

  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )locale=([^;]+)/)
    setLocale(m ? decodeURIComponent(m[1]) : null)
  }, [])

  function changeLocale(next: string) {
    const oneYear = 60 * 60 * 24 * 365
    document.cookie = `locale=${encodeURIComponent(next)}; path=/; max-age=${oneYear}`
    window.location.reload()
  }

  const currentLocale = locale && (locale === 'ru' || locale === 'en') ? locale : 'ru'
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <NotificationsButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {currentLocale.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLocale('ru')}>Русский</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLocale('en')}>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

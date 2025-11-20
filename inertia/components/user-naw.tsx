import User from '#models/user'
import { Link, usePage, router } from '@inertiajs/react'
import { IconDotsVertical, IconLogout, IconUserCircle } from '@tabler/icons-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar'
export function NavUser() {
  const { isMobile } = useSidebar()
  const { props: pageProps } = usePage<{ user: User; userAvatarUrl: string | null }>()
  const user = pageProps?.user
  const avatarUrl = (pageProps?.userAvatarUrl || '') as string
  const csrfToken = (pageProps?.csrfToken || '') as string
  const layoutMessages = (pageProps as any)?.layoutMessages as any
  const fullName = user?.fullName || ''
  const email = user?.email || ''
  const fnSmall = fullName
    .split(' ')
    .map((part) => part[0])
    .join('')

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="rounded-lg">{fnSmall}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {fullName || layoutMessages?.root?.user?.guest || 'Гость'}
                </span>
                <span className="text-muted-foreground truncate text-xs">{email}</span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                  <AvatarFallback className="rounded-lg">{fnSmall}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {fullName || layoutMessages?.root?.user?.guest || 'Гость'}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <IconUserCircle />
                  {layoutMessages?.root?.settingsMenu?.profile || 'Профиль'}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                router.post('/logout', {}, { headers: { 'X-CSRF-TOKEN': csrfToken } })
              }}
            >
              <IconLogout />
              {layoutMessages?.root?.settingsMenu?.logout || 'Выход'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

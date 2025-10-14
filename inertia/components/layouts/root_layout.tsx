import { Barcode, Plus } from 'lucide-react'
import { Link } from '@inertiajs/react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '~/components/ui/navigation-menu'
import { Separator } from '../ui/separator'
import { useTheme } from '../theme-provider'

type RootLayoutProps = {
  children: React.ReactNode
  title: string
}

function RootLayout({ children, title }: RootLayoutProps) {
  const { setTheme, theme } = useTheme()
  return (
    <div className="">
      <div className="flex justify-between p-2">
        <div className="flex gap-4">
          <div>
            <Link href="/" className="flex justify-end items-end gap-2">
              <Barcode size={30} className="text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text text-2xl font-extrabold">
                Dataship
              </span>
            </Link>
          </div>

          <NavigationMenu>
            <NavigationMenuList className="gap-4 items-end">
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/sources" className="flex justify-end items-end gap-2">
                    Источники данных
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/datasets" className="flex justify-end items-end gap-2">
                    Датасеты
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/migrations" className="flex justify-end items-end gap-2">
                    Миграции
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/tasks" className="flex justify-end items-end gap-2">
                    Задания
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        {/* RIGHT */}
        <div className="flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <Plus />
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/sources/new">Источник данных</Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/datasets/new">Датасет</Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/migrations/new">Миграцию</Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/tasks/new">Задание</Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Настройки</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-2 p-2">
                    <li>
                      <h3 className="text-sm font-normal text-gray-400">Безопасность</h3>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/profile">Пользователи</Link>
                      </NavigationMenuLink>
                    </li>

                    <Separator />
                    <li>
                      <h3 className="text-sm font-normal text-gray-400"> Пользователь</h3>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/profile">Профиль</Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/logout">Выйти</Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4.5"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path>
                    <path d="M12 3l0 18"></path>
                    <path d="M12 9l4.65 -4.65"></path>
                    <path d="M12 14.3l7.37 -7.37"></path>
                    <path d="M12 19.6l8.85 -8.85"></path>
                  </svg>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>

      <div className="px-4 py-3">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="p-4">
        {/* <div className="rounded-lg border bg-muted p-4 shadow-sm">{children}</div> */}
        {children}
      </div>
    </div>
  )
}

export { RootLayout }

import { usePage, router } from '@inertiajs/react'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

export function LanguageToggle() {
  const page = usePage<{ locale: string }>()

  function changeLocale(next: string) {
    const form = new FormData()
    form.append('code', next)
    router.post('/settings/locale', form, {
      preserveScroll: true,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {String(page.props.locale || 'ru').toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLocale('ru')}>Русский</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLocale('en')}>English</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

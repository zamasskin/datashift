import React from 'react'
import { Link, usePage } from '@inertiajs/react'
import { ThemeToggle } from '~/components/theme-toggle'
import { LanguageToggle } from '~/components/language-toggle'

export const PublicLayout = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const { props } = usePage<{ layoutMessages?: { brand?: string; loginLink?: string; footerCopyright?: string } }>()
  const layout = props.layoutMessages || {}
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-12">
          <Link href="/login" className="text-sm font-semibold tracking-tight hover:underline">
            {layout.brand || 'Datashift'}
          </Link>
          <h1 className="text-sm font-medium">{title}</h1>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="text-sm hover:underline">
              {layout.loginLink || 'Login'}
            </Link>
          </div>
        </div>
      </header>
      <main className="px-4 lg:px-6 py-4">{children}</main>
      <footer className="border-t">
        <div className="px-4 lg:px-6 py-3 text-xs text-muted-foreground">{layout.footerCopyright || `© ${new Date().getFullYear()} Datashift`}</div>
      </footer>
    </div>
  )
}

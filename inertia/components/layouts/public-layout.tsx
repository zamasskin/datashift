import React from 'react'
import { Link } from '@inertiajs/react'
import { ThemeToggle } from '~/components/theme-toggle'
import { LanguageToggle } from '~/components/language-toggle'
import { useI18n } from '~/hooks/useI18nLocal'

export const PublicLayout = ({
  children,
  title,
}: {
  children: React.ReactNode
  title?: string
}) => {
  const { t } = useI18n()
  const pageTitle = title ?? String(t('layout.brand', 'Datashift'))
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-12">
          <Link href="/login" className="text-sm font-semibold tracking-tight hover:underline">
            {String(t('layout.brand', 'Datashift'))}
          </Link>
          <h1 className="text-sm font-medium">{pageTitle}</h1>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="text-sm hover:underline">
              {String(t('layout.loginLink', 'Login'))}
            </Link>
          </div>
        </div>
      </header>
      <main className="px-4 lg:px-6 py-4">{children}</main>
      <footer className="border-t">
        <div className="px-4 lg:px-6 py-3 text-xs text-muted-foreground">
          {(() => {
            const year = new Date().getFullYear()
            const tpl = String(t('layout.footer.copyright', `© ${year} Datashift`))
            return tpl.replace('{year}', String(year))
          })()}
        </div>
      </footer>
    </div>
  )
}

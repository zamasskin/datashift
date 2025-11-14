import React from 'react'
import { Link } from '@inertiajs/react'

export const PublicLayout = ({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-12">
          <Link href="/login" className="text-sm font-semibold tracking-tight hover:underline">
            Datashift
          </Link>
          <h1 className="text-sm font-medium">{title}</h1>
          <Link href="/login" className="text-sm hover:underline">
            Войти
          </Link>
        </div>
      </header>
      <main className="px-4 lg:px-6 py-4">
        {children}
      </main>
      <footer className="border-t">
        <div className="px-4 lg:px-6 py-3 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Datashift
        </div>
      </footer>
    </div>
  )
}
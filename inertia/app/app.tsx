/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { ThemeProvider } from '~/components/theme-provider'
import { Toaster } from 'sonner'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx'))
  },

  setup({ el, App, props }) {
    hydrateRoot(
      el,
      <ThemeProvider defaultTheme="dark" storageKey="dark">
        <Toaster
          richColors
          closeButton
          position="top-right"
          toastOptions={{
            classNames: {
              toast: 'bg-card text-card-foreground border border-border',
              title: 'font-medium',
              description: 'text-muted-foreground',
            },
          }}
        />
        <App {...props} />
      </ThemeProvider>
    )
  },
})

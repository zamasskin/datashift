import { Head, usePage } from '@inertiajs/react'
import { LoginForm } from '~/components/login-form'
import { ThemeToggle } from '~/components/theme-toggle'
import { LanguageToggle } from '~/components/language-toggle'

const Login = () => {
  const { props } = usePage<{ messages?: Record<string, string> }>()
  const messages = props.messages || {}
  return (
    <>
      <Head title={messages.title || 'Login'} />
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <LoginForm messages={messages} />
        </div>
      </div>
    </>
  )
}

export default Login

import { Head } from '@inertiajs/react'
import { LoginForm } from '~/components/login-form'
import { ThemeToggle } from '~/components/theme-toggle'

const Login = () => {
  return (
    <>
      <Head title="Вход" />
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <LoginForm />
        </div>
      </div>
    </>
  )
}

export default Login

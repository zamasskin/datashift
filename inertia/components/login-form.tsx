import { cn } from '~/lib/utils'
import { Card, CardContent } from './ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useForm, usePage } from '@inertiajs/react'

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  method?: string
  action?: string
  messages?: {
    title?: string
    welcome?: string
    prompt?: string
    email?: string
    password?: string
    submit?: string
    submitting?: string
    termsText1?: string
    termsService?: string
    termsText2?: string
    privacyPolicy?: string
  }
}

export function LoginForm({
  className,
  method = 'POST',
  action = '/login',
  messages = {},
  ...props
}: LoginFormProps) {
  const { props: pageProps } = usePage<{ csrfToken?: string; errors?: Record<string, string> }>()
  const csrfToken = pageProps?.csrfToken
  const errors = pageProps?.errors
  const form = useForm({ email: '', password: '', _csrf: csrfToken || '' })
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            method={method}
            action={action}
            onSubmit={(e) => {
              e.preventDefault()
              form.post(action)
            }}
          >
            <FieldGroup>
              {csrfToken && <input type="hidden" name="_csrf" value={csrfToken} />}

              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">{messages.welcome || 'Welcome'}</h1>
                <p className="text-muted-foreground text-balance">
                  {messages.prompt || 'Sign in to your account'}
                </p>
              </div>
              {errors?.login && (
                <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors.login}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email">{messages.email || 'Email'}</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={form.data.email}
                  onChange={(e) => form.setData('email', e.target.value)}
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">{messages.password || 'Password'}</FieldLabel>
                  {/* <a href="#" className="ml-auto text-sm underline-offset-2 hover:underline">
                    Забыли пароль?
                  </a> */}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={form.data.password}
                  onChange={(e) => form.setData('password', e.target.value)}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={form.processing}>
                  {form.processing
                    ? messages.submitting || 'Signing in...'
                    : messages.submit || 'Sign In'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/images/login_bg.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        {messages.termsText1 || 'By clicking “Continue”, you agree to our '}
        <a href="/terms">{messages.termsService || 'Terms of Service'}</a>
        {messages.termsText2 || ' and '}
        <a href="/privacy">{messages.privacyPolicy || 'Privacy Policy.'}</a>
      </FieldDescription>
    </div>
  )
}

import { Head, Link, usePage, router } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '~/components/ui/input-group'

type ProfileProps = {
  user: { id: number; email: string; fullName: string | null }
  errors?: Record<string, string>
}

const ProfilePage = () => {
  const { props } = usePage<ProfileProps>()
  const u = props.user
  const errors = (props as any).errors as Record<string, string> | undefined
  const [email, setEmail] = useState(u?.email || '')
  const [fullName, setFullName] = useState(u?.fullName || '')
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string> | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    setEmail(u?.email || '')
    setFullName(u?.fullName || '')
  }, [u?.email, u?.fullName])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('email', email)
    fd.append('fullName', fullName)
    if (avatarFile) {
      fd.append('avatar', avatarFile)
    }
    router.put('/profile', fd, { forceFormData: true })
  }

  const getXsrfToken = () => {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
    return m ? decodeURIComponent(m[1]) : null
  }

  const onSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordErrors(null)
    try {
      const token = getXsrfToken()
      const res = await fetch('/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-XSRF-TOKEN': token } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ password: newPassword, passwordConfirmation }),
      })

      if (res.ok) {
        setNewPassword('')
        setPasswordConfirmation('')
        setPasswordErrors(null)
        return
      }

      if (res.status === 422) {
        const data = await res.json().catch(() => null)
        setPasswordErrors((data && data.errors) || { password: 'Ошибка валидации' })
        return
      }

      setPasswordErrors({ password: 'Не удалось обновить пароль' })
    } catch (err) {
      setPasswordErrors({ password: 'Ошибка сети. Повторите попытку.' })
    }
  }

  // Удалён отдельный сабмит аватара; теперь аватар отправляется вместе с основными полями

  return (
    <>
      <Head title="Профиль" />
      <div className="px-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Редактирование профиля</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors?.email && (
                  <p className="text-destructive text-sm">{errors.email}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Имя</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ваше имя"
                />
                {errors?.fullName && (
                  <p className="text-destructive text-sm">{errors.fullName}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="avatar">Аватар</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
                {errors?.avatar && (
                  <p className="text-destructive text-sm">{errors.avatar}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit">Сохранить</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/">Отмена</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Смена пароля</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmitPassword} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Новый пароль</Label>
                <div className="relative">
                  <InputGroup>
                    <InputGroupInput
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      className="pr-10"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        aria-label={showNewPassword ? 'Скрыть пароль' : 'Показать пароль'}
                        className="absolute right-1.5 top-1.5"
                        onClick={() => setShowNewPassword((v) => !v)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                {(passwordErrors?.password || errors?.password) && (
                  <p className="text-destructive text-sm">
                    {passwordErrors?.password || errors?.password}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="passwordConfirmation">Подтверждение пароля</Label>
                <div className="relative">
                  <InputGroup>
                    <InputGroupInput
                      id="passwordConfirmation"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      placeholder="Повторите новый пароль"
                      className="pr-10"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        aria-label={showNewPassword ? 'Скрыть пароль' : 'Показать пароль'}
                        className="absolute right-1.5 top-1.5"
                        onClick={() => setShowNewPassword((v) => !v)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                {(passwordErrors?.passwordConfirmation || errors?.passwordConfirmation) && (
                  <p className="text-destructive text-sm">
                    {passwordErrors?.passwordConfirmation || errors?.passwordConfirmation}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={!newPassword || newPassword.length < 8}>
                  Обновить пароль
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Карточка загрузки аватара удалена: загрузка теперь в основной форме */}
      </div>
    </>
  )
}

ProfilePage.layout = (page: React.ReactNode) => {
  return <RootLayout title="Профиль">{page}</RootLayout>
}

export default ProfilePage

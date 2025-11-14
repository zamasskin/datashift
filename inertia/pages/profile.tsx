import { Head, usePage, router, Link } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Item, ItemMedia, ItemContent, ItemDescription, ItemTitle } from '~/components/ui/item'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '~/components/ui/input-group'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/badge'

type ProfileProps = {
  user: { id: number; email: string; fullName: string | null; avatarUrl?: string | null }
  errors?: Record<string, string>
  overview?: {
    counts: { sources: number; migrations: number }
    latestSources: Array<{ id: number; name: string; type: string }>
    latestMigrations: Array<{ id: number; name: string; isActive: boolean }>
  }
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
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(u?.avatarUrl || null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    setEmail(u?.email || '')
    setFullName(u?.fullName || '')
    setAvatarPreviewUrl(u?.avatarUrl || null)
  }, [u?.email, u?.fullName])

  // Обновляем локальный превью URL при выборе нового файла и чистим blob URL
  useEffect(() => {
    if (!avatarFile) return
    const url = URL.createObjectURL(avatarFile)
    setAvatarPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [avatarFile])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('email', email)
    fd.append('fullName', fullName)
    if (avatarFile) {
      fd.append('avatar', avatarFile)
    }
    router.put('/profile', fd, {
      forceFormData: true,
      onSuccess: () => {
        toast.success('Данные сохранены', { duration: 4000 })
      },
      onError: () => {
        toast.error('Не удалось сохранить изменения', { duration: 6000 })
      },
    })
  }

  const onCancel = () => {
    setEmail(u?.email || '')
    setFullName(u?.fullName || '')
    setAvatarFile(null)
    setAvatarPreviewUrl(u?.avatarUrl || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Редактирование профиля</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Прямоугольное превью аватара внутри основной формы */}
              <div className="grid gap-2">
                <Label>Аватар</Label>
                <Item variant="outline" className="p-0">
                  <ItemContent className="w-full">
                    <ItemMedia
                      variant="image"
                      className="w-full h-40 md:h-56 rounded-md overflow-hidden cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Выбрать файл аватара"
                    >
                      {avatarPreviewUrl ? (
                        <img
                          src={avatarPreviewUrl}
                          alt="Аватар"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-3xl font-semibold">
                            {(fullName || email || '?').slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </ItemMedia>
                    {errors?.avatar && (
                      <ItemDescription className="text-destructive">
                        {errors.avatar}
                      </ItemDescription>
                    )}
                  </ItemContent>
                </Item>
                <input
                  ref={fileInputRef}
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors?.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Имя</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ваше имя"
                />
                {errors?.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit">Сохранить</Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Отмена
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

        {/* Обзор: Источники данных */}
        <Card>
          <CardHeader>
            <CardTitle>Источники данных</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Всего</span>
              <Badge variant="outline">{props?.overview?.counts?.sources ?? 0}</Badge>
            </div>
            <div className="space-y-2">
              {(props?.overview?.latestSources || []).length ? (
                props!.overview!.latestSources.map((s) => (
                  <Item key={s.id} variant="muted" className="p-2">
                    <ItemContent>
                      <ItemTitle className="text-sm font-medium">{s.name}</ItemTitle>
                      <ItemDescription className="text-xs">{s.type}</ItemDescription>
                    </ItemContent>
                  </Item>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Нет источников</p>
              )}
            </div>
            <div className="pt-1">
              <Button variant="outline" size="sm" asChild>
                <Link href="/sources">Открыть источники</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Обзор: Миграции */}
        <Card>
          <CardHeader>
            <CardTitle>Миграции</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Всего</span>
              <Badge variant="outline">{props?.overview?.counts?.migrations ?? 0}</Badge>
            </div>
            <div className="space-y-2">
              {(props?.overview?.latestMigrations || []).length ? (
                props!.overview!.latestMigrations.map((m) => (
                  <Item key={m.id} variant="muted" className="p-2">
                    <ItemContent>
                      <ItemTitle className="text-sm font-medium">{m.name}</ItemTitle>
                      <ItemDescription className="text-xs">
                        Статус: {m.isActive ? 'активна' : 'выключена'}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Нет миграций</p>
              )}
            </div>
            <div className="pt-1 flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/migrations">Открыть миграции</Link>
              </Button>
            </div>
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

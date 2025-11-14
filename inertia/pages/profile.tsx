import { Head, Link, usePage, router } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { useEffect, useState } from 'react'

type ProfileProps = {
  user: { id: number; email: string; fullName: string | null }
}

const ProfilePage = () => {
  const { props } = usePage<ProfileProps>()
  const u = props.user
  const [email, setEmail] = useState(u?.email || '')
  const [fullName, setFullName] = useState(u?.fullName || '')
  const [password, setPassword] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    setEmail(u?.email || '')
    setFullName(u?.fullName || '')
  }, [u?.email, u?.fullName])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.put('/profile', { email, fullName, password })
  }

  const onSubmitAvatar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!avatarFile) return
    const fd = new FormData()
    fd.append('avatar', avatarFile)
    router.post('/profile/avatar', fd, { forceFormData: true })
  }

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
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Имя</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Новый пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Оставьте пустым, чтобы не менять"
                />
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
            <CardTitle>Загрузка аватара</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmitAvatar} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="avatar">Выберите файл</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={!avatarFile}>Загрузить фото</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

ProfilePage.layout = (page: React.ReactNode) => {
  return <RootLayout title="Профиль">{page}</RootLayout>
}

export default ProfilePage
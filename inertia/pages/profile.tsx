import { Head, Link, usePage, router } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { useEffect, useState } from 'react'

type ProfileProps = {
  user: { id: number; email: string; fullName: string | null; avatarUrl: string | null }
}

const ProfilePage = () => {
  const { props } = usePage<ProfileProps>()
  const u = props.user
  const [email, setEmail] = useState(u?.email || '')
  const [fullName, setFullName] = useState(u?.fullName || '')
  const [avatarUrl, setAvatarUrl] = useState(u?.avatarUrl || '')
  const [password, setPassword] = useState('')

  useEffect(() => {
    setEmail(u?.email || '')
    setFullName(u?.fullName || '')
    setAvatarUrl(u?.avatarUrl || '')
  }, [u?.email, u?.fullName, u?.avatarUrl])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.put('/profile', { email, fullName, avatarUrl: avatarUrl || null, password })
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
                <Label htmlFor="avatarUrl">Аватар (URL)</Label>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
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
      </div>
    </>
  )
}

ProfilePage.layout = (page: React.ReactNode) => {
  return <RootLayout title="Профиль">{page}</RootLayout>
}

export default ProfilePage
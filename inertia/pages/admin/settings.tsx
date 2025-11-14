import { Head, usePage, router } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '~/components/ui/select'
import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Tabs } from '~/components/ui/tabs'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '~/components/ui/dialog'

type AdminSettingsProps = {
  users: Array<{ id: number; email: string; fullName: string | null; role: 'user' | 'admin' }>
  errors?: Record<string, string>
}

const AdminSettingsPage = () => {
  const { props } = usePage<AdminSettingsProps>()
  const users = props.users || []
  const errors = (props as any).errors as Record<string, string> | undefined

  // Create user form state
  const [newEmail, setNewEmail] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user')

  // Edit dialog state
  const [editOpenId, setEditOpenId] = useState<number | null>(null)
  const editingUser = useMemo(
    () => users.find((u) => u.id === editOpenId) || null,
    [users, editOpenId]
  )
  const [editEmail, setEditEmail] = useState('')
  const [editFullName, setEditFullName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user')

  useEffect(() => {
    if (!editingUser) return
    setEditEmail(editingUser.email || '')
    setEditFullName(editingUser.fullName || '')
    setEditPassword('')
    setEditRole((editingUser.role as 'user' | 'admin') || 'user')
  }, [editingUser?.id])

  // локальные предпочтения: тема (без чтения localStorage во время рендера)
  const [prefTheme, setPrefTheme] = useState<'system' | 'light' | 'dark'>('system')
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dark') as 'system' | 'light' | 'dark' | null
      if (saved) setPrefTheme(saved)
    } catch {}
  }, [])

  const onCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { email: newEmail, fullName: newFullName, password: newPassword, role: newRole }
    router.post('/users', payload, {
      onSuccess: () => {
        toast.success('Пользователь создан')
        setNewEmail('')
        setNewFullName('')
        setNewPassword('')
        setNewRole('user')
      },
      onError: (errs: any) => {
        const msg =
          errs?.email || errs?.password || errs?.error || 'Не удалось создать пользователя'
        toast.error(msg)
      },
    })
  }

  const onUpdateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    const payload: any = { email: editEmail, fullName: editFullName, role: editRole }
    if (editPassword) payload.password = editPassword
    router.put(`/users/${editingUser.id}`, payload, {
      onSuccess: () => {
        toast.success('Изменения сохранены')
        setEditOpenId(null)
      },
      onError: (errs: any) => {
        const msg = errs?.email || errs?.error || 'Не удалось сохранить изменения'
        toast.error(msg)
      },
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm('Удалить пользователя?')) return
    router.delete('/users', {
      data: { id },
      onSuccess: () => toast.success('Пользователь удалён'),
      onError: () => toast.error('Не удалось удалить пользователя'),
      onFinish: () => router.visit('/settings'),
    })
  }

  return (
    <>
      <Head title="Админ — Настройки" />
      <div className="px-4 grid grid-cols-1 gap-4">
        <Tabs defaultValue="users">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Управление пользователями</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create user */}
                <form
                  onSubmit={onCreateUser}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
                >
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="newEmail">Email</Label>
                    <Input
                      id="newEmail"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                    {errors?.email && <p className="text-destructive text-sm">{errors.email}</p>}
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="newFullName">Имя</Label>
                    <Input
                      id="newFullName"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Имя пользователя"
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="newPassword">Пароль</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Роль</Label>
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as 'user' | 'admin')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">user</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Button type="submit">Добавить</Button>
                  </div>
                </form>

                {/* Users table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length ? (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.id}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.fullName || '—'}</TableCell>
                          <TableCell>{u.role || 'user'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog
                                open={editOpenId === u.id}
                                onOpenChange={(open) => setEditOpenId(open ? u.id : null)}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    Редактировать
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[480px]">
                                  <DialogHeader>
                                    <DialogTitle>Редактирование пользователя #{u.id}</DialogTitle>
                                  </DialogHeader>
                                  <form onSubmit={onUpdateUser} className="space-y-4 mt-2">
                                    <div className="grid gap-2">
                                      <Label htmlFor="editEmail">Email</Label>
                                      <Input
                                        id="editEmail"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="editFullName">Имя</Label>
                                      <Input
                                        id="editFullName"
                                        value={editFullName}
                                        onChange={(e) => setEditFullName(e.target.value)}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="editPassword">
                                        Новый пароль (опционально)
                                      </Label>
                                      <Input
                                        id="editPassword"
                                        type="password"
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>Роль</Label>
                                      <Select value={editRole} onValueChange={(v) => setEditRole(v as 'user' | 'admin')}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="user">user</SelectItem>
                                          <SelectItem value="admin">admin</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => setEditOpenId(null)}
                                        >
                                          Отмена
                                        </Button>
                                      </DialogClose>
                                      <Button type="submit">Сохранить</Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(u.id)}
                              >
                                Удалить
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <div className="text-sm text-muted-foreground">Нет пользователей</div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Личные настройки администратора</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Эти настройки сохраняются локально в браузере.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="grid gap-2">
                    <Label>Тема</Label>
                    <Select
                      value={prefTheme}
                      onValueChange={(v) => {
                        const val = v as 'system' | 'light' | 'dark'
                        setPrefTheme(val)
                        try {
                          localStorage.setItem('dark', val)
                          toast.success('Тема обновлена')
                        } catch {
                          toast.error('Не удалось сохранить тему')
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">system</SelectItem>
                        <SelectItem value="light">light</SelectItem>
                        <SelectItem value="dark">dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        try {
                          localStorage.removeItem('dark')
                          toast.success('Сброшены настройки темы')
                        } catch {}
                      }}
                    >
                      Сбросить тему
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </>
  )
}

AdminSettingsPage.layout = (page: React.ReactNode) => {
  return <RootLayout title="Админ • Настройки">{page}</RootLayout>
}

export default AdminSettingsPage

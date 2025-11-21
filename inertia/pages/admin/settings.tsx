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
import React from 'react'
import { useI18n } from '~/hooks/useI18nLocal'

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

  const { t } = useI18n()

  const onCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { email: newEmail, fullName: newFullName, password: newPassword, role: newRole }
    router.post('/users', payload, {
      onSuccess: () => {
        toast.success(t('admin.settings.users.createSuccess', 'Пользователь создан'))
        setNewEmail('')
        setNewFullName('')
        setNewPassword('')
        setNewRole('user')
      },
      onError: (errs: any) => {
        const msg = errs?.email || errs?.password || errs?.error || t('admin.settings.users.createFail', 'Не удалось создать пользователя')
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
        toast.success(t('admin.settings.users.updateSuccess', 'Изменения сохранены'))
        setEditOpenId(null)
      },
      onError: (errs: any) => {
        const msg = errs?.email || errs?.error || t('admin.settings.users.updateFail', 'Не удалось сохранить изменения')
        toast.error(msg)
      },
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm(t('admin.settings.users.confirmDelete', 'Удалить пользователя?'))) return
    router.delete('/users', {
      data: { id, redirectTo: '/settings' },
      onSuccess: () => toast.success(t('admin.settings.users.deleteSuccess', 'Пользователь удалён')),
      onError: () => toast.error(t('admin.settings.users.deleteFail', 'Не удалось удалить пользователя')),
    })
  }

  return (
    <>
      <Head title={t('admin.settings.title', 'Админ — Настройки')} />
      <div className="px-4 grid grid-cols-1 gap-4">
        <Tabs defaultValue="users">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.settings.users.manageTitle', 'Управление пользователями')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create user */}
                <form
                  onSubmit={onCreateUser}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
                >
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="newEmail">{t('admin.settings.form.emailLabel', 'Email')}</Label>
                    <Input
                      id="newEmail"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={t('admin.settings.form.emailPlaceholder', 'user@example.com')}
                    />
                    {errors?.email && <p className="text-destructive text-sm">{errors.email}</p>}
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="newFullName">{t('admin.settings.form.fullNameLabel', 'Имя')}</Label>
                    <Input
                      id="newFullName"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder={t('admin.settings.form.fullNamePlaceholder', 'Имя пользователя')}
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="newPassword">{t('admin.settings.form.passwordLabel', 'Пароль')}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('admin.settings.form.passwordPlaceholder', 'Минимум 8 символов')}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('admin.settings.form.roleLabel', 'Роль')}</Label>
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as 'user' | 'admin')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">{t('admin.settings.roles.user', 'user')}</SelectItem>
                        <SelectItem value="admin">{t('admin.settings.roles.admin', 'admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Button type="submit">{t('admin.settings.actions.create', 'Добавить')}</Button>
                  </div>
                </form>

                {/* Users table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.settings.table.id', 'ID')}</TableHead>
                      <TableHead>{t('admin.settings.table.email', 'Email')}</TableHead>
                      <TableHead>{t('admin.settings.table.fullName', 'Имя')}</TableHead>
                      <TableHead>{t('admin.settings.table.role', 'Роль')}</TableHead>
                      <TableHead className="text-right">{t('admin.settings.table.actions', 'Действия')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length ? (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.id}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.fullName || '—'}</TableCell>
                          <TableCell>{u.role || t('admin.settings.roles.user', 'user')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog
                                open={editOpenId === u.id}
                                onOpenChange={(open) => setEditOpenId(open ? u.id : null)}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    {t('admin.settings.actions.edit', 'Редактировать')}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[480px]">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {t('admin.settings.dialog.editUserTitlePrefix', 'Редактирование пользователя')} #{u.id}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <form onSubmit={onUpdateUser} className="space-y-4 mt-2">
                                    <div className="grid gap-2">
                                      <Label htmlFor="editEmail">{t('admin.settings.form.emailLabel', 'Email')}</Label>
                                      <Input
                                        id="editEmail"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="editFullName">{t('admin.settings.form.fullNameLabel', 'Имя')}</Label>
                                      <Input
                                        id="editFullName"
                                        value={editFullName}
                                        onChange={(e) => setEditFullName(e.target.value)}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="editPassword">
                                        {t('admin.settings.form.newPasswordOptional', 'Новый пароль (опционально)')}
                                      </Label>
                                      <Input
                                        id="editPassword"
                                        type="password"
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>{t('admin.settings.form.roleLabel', 'Роль')}</Label>
                                      <Select value={editRole} onValueChange={(v) => setEditRole(v as 'user' | 'admin')}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="user">{t('admin.settings.roles.user', 'user')}</SelectItem>
                                          <SelectItem value="admin">{t('admin.settings.roles.admin', 'admin')}</SelectItem>
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
                                          {t('admin.settings.actions.cancel', 'Отмена')}
                                        </Button>
                                      </DialogClose>
                                      <Button type="submit">{t('admin.settings.actions.save', 'Сохранить')}</Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(u.id)}
                              >
                                {t('admin.settings.actions.delete', 'Удалить')}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <div className="text-sm text-muted-foreground">{t('admin.settings.table.empty', 'Нет пользователей')}</div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.settings.adminPrefs.title', 'Личные настройки администратора')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('admin.settings.adminPrefs.description', 'Эти настройки сохраняются локально в браузере.')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="grid gap-2">
                    <Label>{t('admin.settings.theme.label', 'Тема')}</Label>
                    <Select
                      value={prefTheme}
                      onValueChange={(v) => {
                        const val = v as 'system' | 'light' | 'dark'
                        setPrefTheme(val)
                        try {
                          localStorage.setItem('dark', val)
                          toast.success(t('admin.settings.theme.updateSuccess', 'Тема обновлена'))
                        } catch {
                          toast.error(t('admin.settings.theme.updateFail', 'Не удалось сохранить тему'))
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">{t('admin.settings.theme.system', 'system')}</SelectItem>
                        <SelectItem value="light">{t('admin.settings.theme.light', 'light')}</SelectItem>
                        <SelectItem value="dark">{t('admin.settings.theme.dark', 'dark')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        try {
                          localStorage.removeItem('dark')
                          toast.success(t('admin.settings.theme.resetSuccess', 'Сброшены настройки темы'))
                        } catch {}
                      }}
                    >
                      {t('admin.settings.theme.reset', 'Сбросить тему')}
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

function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  return <RootLayout title={t('admin.settings.title', 'Админ • Настройки')}>{children}</RootLayout>
}

AdminSettingsPage.layout = (page: React.ReactNode) => {
  return <AdminSettingsLayout>{page}</AdminSettingsLayout>
}

export default AdminSettingsPage

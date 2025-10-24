import Migration from '#models/migration'
import { Head } from '@inertiajs/react'
import { ArrowDownUp, Save, Settings } from 'lucide-react'
import { useState } from 'react'
import { RootLayout } from '~/components/root-layout'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

const MigrationEdit = ({ migration }: { migration: Migration }) => {
  const [name, setName] = useState(migration.name)
  return (
    <>
      <Head title="Миграции" />
      <div className="px-4 lg:px-6 space-y-4">
        <div className="flex gap-4 justify-between items-end">
          <div className="grid w-full max-w-sm items-center gap-3">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-[320px]"
            />
          </div>
          <div className="flex justify-end">
            <Button variant="outline">
              <Save />
              Сохранить
            </Button>
          </div>
        </div>

        <Tabs defaultValue="config" className="mt-8">
          <TabsList>
            <TabsTrigger value="config">
              <Settings />
              Настройки
            </TabsTrigger>
            <TabsTrigger value="migrations">
              <ArrowDownUp />
              Миграции
            </TabsTrigger>
          </TabsList>
          <TabsContent value="config" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Настройки</CardTitle>
                <CardDescription>
                  Добавьте настройки, которые будут использоваться в миграции.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Здесь будет интерфейс управления параметрами миграции.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="migrations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Миграции</CardTitle>
                <CardDescription>
                  Добавьте миграции, которые будут использоваться в миграции.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Здесь будет интерфейс управления миграциями.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

MigrationEdit.layout = (page: React.ReactNode) => {
  return <RootLayout title="Миграции">{page}</RootLayout>
}

export default MigrationEdit

import Migration from '#models/migration'
import { Head } from '@inertiajs/react'
import { ArrowDownUp, FileWarning, Save, Settings, Trash } from 'lucide-react'
import { useState } from 'react'
import { RootLayout } from '~/components/root-layout'
import { Alert, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import {
  ItemGroup,
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from '~/components/ui/item'
import { Label } from '~/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

const MigrationEdit = ({ migration }: { migration: Migration }) => {
  const [name, setName] = useState(migration.name)
  const [cronExpression, setCronExpression] = useState(migration.cronExpression || '')
  const [fetchConfigs, setFetchConfigs] = useState(migration.fetchConfigs || [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
          <TabsContent value="config" className="mt-4 max-w-xl">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Параметры</CardTitle>
                  <CardDescription>
                    Добавьте настройки, которые будут использоваться в миграции.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Настройка прараметров</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Расписание</CardTitle>
                  <CardDescription>
                    Укажите расписание выполнения миграции в формате cron-выражения.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid w-full max-w-sm items-center gap-3">
                    <Label htmlFor="cronExpression">Название</Label>
                    <Input
                      id="cronExpression"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      className="w-[320px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="migrations" className="mt-4 max-w-xl">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Датасеты</CardTitle>
                  <CardDescription>
                    Добавьте датасеты, которые будут использоваться в миграции.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex w-full max-w-xl flex-col gap-6">
                    <ItemGroup className="gap-4">
                      <MyItem name="sql1" icon="/icons/sql-edit.png" />
                      <MyItem name="sql2" icon="/icons/sql-build.png" />
                      <MyItem name="sql3" icon="/icons/merge.png" />
                      <MyItem name="sql3" icon="/icons/modify.png" />
                    </ItemGroup>

                    <Button>Добавить</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Выгрузки</CardTitle>
                  <CardDescription>
                    Укажите выгрузки, которые будут использоваться в миграции.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex w-full max-w-xl flex-col gap-6">
                    {fetchConfigs.length == 0 && (
                      <Alert>
                        <FileWarning />
                        <AlertTitle>
                          Предупреждение: сначала добавьте датасеты, чтобы создать выгрузки
                        </AlertTitle>
                      </Alert>
                    )}

                    {fetchConfigs.length > 0 && <Button>Добавить</Button>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline">
            <Trash />
            Удалить
          </Button>
          <Button>
            <Save />
            Сохранить
          </Button>
        </div>
      </div>
    </>
  )
}

export function MyItem({ name, icon }: { name: string; icon: string }) {
  return (
    <Item variant="outline">
      <ItemMedia>
        <img src={icon} alt={name} width={32} height={32} className="object-cover grayscale" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="line-clamp-1">
          Sql запрос - <span className="text-muted-foreground">Источник данных 1</span>
        </ItemTitle>
        <ItemDescription>
          <code>SELECT * FROM b_iblock_element</code>{' '}
        </ItemDescription>
      </ItemContent>
      <ItemContent className="flex-none text-center">
        <ItemDescription>
          <div className="flex gap-2">
            <Button size="icon" variant="outline">
              <Trash />
            </Button>
            <Button size="icon" variant="outline">
              <Settings />
            </Button>
          </div>
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}

MigrationEdit.layout = (page: React.ReactNode) => {
  return <RootLayout title="Миграции">{page}</RootLayout>
}

export default MigrationEdit

import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Badge } from '~/components/ui/badge'

function ScreenshotPlaceholder(props: { label?: string; className?: string }) {
  return (
    <div
      className={
        'rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 text-muted-foreground flex items-center justify-center text-sm h-48 w-full ' +
        (props.className || '')
      }
    >
      {props.label || 'Здесь будет скриншот'}
    </div>
  )
}

const Help = () => {
  return (
    <>
      <Head title="Помощь" />
      <div className="px-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Добро пожаловать в DataShift</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              На этой странице собраны краткие инструкции по основным разделам и действиям. В
              каждом разделе есть место для скриншота интерфейса.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">Источники</Badge>
              <Badge variant="secondary">Миграции</Badge>
              <Badge variant="secondary">Датасеты</Badge>
              <Badge variant="secondary">Ошибки</Badge>
              <Badge variant="secondary">Настройки</Badge>
              <Badge variant="secondary">Профиль</Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="start" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1">
            <TabsTrigger value="start">Начало</TabsTrigger>
            <TabsTrigger value="sources">Источники</TabsTrigger>
            <TabsTrigger value="migrations">Миграции</TabsTrigger>
            <TabsTrigger value="datasets">Датасеты</TabsTrigger>
            <TabsTrigger value="errors">Ошибки</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="start" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Быстрый старт</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Создайте источник данных в разделе «Источники».</li>
                  <li>Настройте миграцию: выберите источник и параметры.</li>
                  <li>Запустите миграцию и отслеживайте прогресс.</li>
                </ol>
                <ScreenshotPlaceholder label="Главная страница и быстрые действия" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Источники данных</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  В разделе «Источники» вы добавляете подключения: базы данных, API, файлы.
                  Укажите параметры, проверьте подключение и сохраните.
                </p>
                <ScreenshotPlaceholder label="Список и форма создания источника" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="migrations" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Миграции</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Миграции описывают, что из источника и как переносится. Настройте шаги,
                  фильтры и расписание (cron) при необходимости. Запускайте и следите за
                  статусами.
                </p>
                <ScreenshotPlaceholder label="Список миграций и экран редактирования" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="datasets" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Датасеты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Датасеты помогают формировать подготовленные выборки для отображения и
                  анализа. Настройте SQL/правила и протестируйте результат.
                </p>
                <ScreenshotPlaceholder label="Список датасетов и тестирование выборки" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ошибки и уведомления</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  В «Ошибках» отображаются сообщения о проблемах, их статус и детали. Вы
                  можете помечать ошибки прочитанными и фильтровать по типу.
                </p>
                <ScreenshotPlaceholder label="Журнал ошибок и фильтры" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Настройки и пользователи</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Здесь настраиваются пользователи, роли и параметры интерфейса. Доступ к
                  редактированию пользователей есть у роли «admin».
                </p>
                <ScreenshotPlaceholder label="Управление пользователями и темой" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

Help.layout = (page: React.ReactNode) => {
  return <RootLayout title="Помощь">{page}</RootLayout>
}

export default Help

import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Badge } from '~/components/ui/badge'
import React from 'react'
import { useI18n } from '~/hooks/useI18nLocal'

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
  const { t } = useI18n()
  return (
    <>
      <Head title={t('help.title', 'Помощь')} />
      <div className="px-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('help.welcome.title', 'Добро пожаловать в DataShift')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {t(
                'help.welcome.description',
                'На этой странице собраны краткие инструкции по основным разделам и действиям. В каждом разделе есть место для скриншота интерфейса.'
              )}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">{t('help.tags.sources', 'Подключения')}</Badge>
              <Badge variant="secondary">{t('help.tags.migrations', 'Миграции')}</Badge>
              <Badge variant="secondary">{t('help.tags.datasets', 'Датасеты')}</Badge>
              <Badge variant="secondary">{t('help.tags.errors', 'Ошибки')}</Badge>
              <Badge variant="secondary">{t('help.tags.settings', 'Настройки')}</Badge>
              <Badge variant="secondary">{t('help.tags.profile', 'Профиль')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="start" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1">
            <TabsTrigger value="start">{t('help.tabs.start', 'Начало')}</TabsTrigger>
            <TabsTrigger value="sources">{t('help.tabs.sources', 'Подключения')}</TabsTrigger>
            <TabsTrigger value="migrations">{t('help.tabs.migrations', 'Миграции')}</TabsTrigger>
            <TabsTrigger value="datasets">{t('help.tabs.datasets', 'Датасеты')}</TabsTrigger>
            <TabsTrigger value="errors">{t('help.tabs.errors', 'Ошибки')}</TabsTrigger>
            <TabsTrigger value="settings">{t('help.tabs.settings', 'Настройки')}</TabsTrigger>
          </TabsList>

          <TabsContent value="start" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('help.start.title', 'Быстрый старт')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>{t('help.start.step1', 'Создайте подключение данных в разделе «Подключения».')}</li>
                  <li>{t('help.start.step2', 'Настройте миграцию: выберите подключение и параметры.')}</li>
                  <li>{t('help.start.step3', 'Запустите миграцию и отслеживайте прогресс.')}</li>
                </ol>
                <ScreenshotPlaceholder label={t('help.start.screenshot', 'Главная страница и быстрые действия')} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('help.sources.title', 'Подключения')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  {t(
                    'help.sources.description',
                    'В разделе «Подключения» вы добавляете подключения: базы данных, API, файлы. Укажите параметры, проверьте подключение и сохраните.'
                  )}
                </p>
                <ScreenshotPlaceholder label={t('help.sources.screenshot', 'Список и форма создания подключения')} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="migrations" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('help.migrations.title', 'Миграции')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  {t(
                    'help.migrations.description',
                    'Миграции описывают, что из подключения и как переносится. Настройте шаги, фильтры и расписание (cron) при необходимости. Запускайте и следите за статусами.'
                  )}
                </p>
                <ScreenshotPlaceholder label={t('help.migrations.screenshot', 'Список миграций и экран редактирования')} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="datasets" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('help.datasets.title', 'Датасеты')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  {t(
                    'help.datasets.description',
                    'Датасеты помогают формировать подготовленные выборки для отображения и анализа. Настройте SQL/правила и протестируйте результат.'
                  )}
                </p>
                <ScreenshotPlaceholder label={t('help.datasets.screenshot', 'Список датасетов и тестирование выборки')} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('help.errors.title', 'Ошибки и уведомления')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  {t(
                    'help.errors.description',
                    'В «Ошибках» отображаются сообщения о проблемах, их статус и детали. Вы можете помечать ошибки прочитанными и фильтровать по типу.'
                  )}
                </p>
                <ScreenshotPlaceholder label={t('help.errors.screenshot', 'Журнал ошибок и фильтры')} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('help.settings.title', 'Настройки и пользователи')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  {t(
                    'help.settings.description',
                    'Здесь настраиваются пользователи, роли и параметры интерфейса. Доступ к редактированию пользователей есть у роли «admin».'
                  )}
                </p>
                <ScreenshotPlaceholder label={t('help.settings.screenshot', 'Управление пользователями и темой')} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

function HelpLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  return <RootLayout title={t('help.title', 'Помощь')}>{children}</RootLayout>
}

Help.layout = (page: React.ReactNode) => {
  return <HelpLayout>{page}</HelpLayout>
}

export default Help

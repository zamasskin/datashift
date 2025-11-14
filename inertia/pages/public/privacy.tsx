import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'

const PrivacyPolicy = () => {
  return (
    <>
      <Head title="Политика конфиденциальности" />
      <div className="px-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Политика конфиденциальности</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              В этой политике описано, какие данные собирает и как использует их сервис DataShift 
              («Сервис»). Используя Сервис, вы соглашаетесь с обработкой данных в соответствии 
              с настоящей политикой.
            </p>

            <Separator />

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">1. Какие данные мы собираем</h2>
              <p>
                Мы можем собирать: информацию учетной записи (e‑mail, имя), технические метаданные 
                о действиях в интерфейсе, логи ошибок и событий, а также данные, которые вы загружаете 
                для работы с миграциями и датасетами.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">2. Как мы используем данные</h2>
              <p>
                Данные используются для предоставления доступа к функциональности, улучшения качества 
                Сервиса, диагностики проблем, обеспечения безопасности и соблюдения требований законодательства.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">3. Хранение и защита</h2>
              <p>
                Мы предпринимаем разумные организационные и технические меры для защиты данных от 
                несанкционированного доступа, изменения или уничтожения. Однако ни один метод передачи 
                и хранения данных не может гарантировать абсолютную безопасность.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">4. Ваши права</h2>
              <p>
                Вы можете запросить доступ к своим данным, их исправление или удаление, а также 
                ограничение обработки. Для реализации прав свяжитесь с нами по контактам ниже.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">5. Изменения политики</h2>
              <p>
                Мы можем время от времени обновлять политику конфиденциальности. Актуальная версия 
                всегда доступна на этой странице.
              </p>
            </section>

            <Separator />

            <p>
              Контакты по вопросам конфиденциальности: <span className="text-foreground">privacy@datashift.local</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

PrivacyPolicy.layout = (page: React.ReactNode) => {
  return <RootLayout title="Политика конфиденциальности">{page}</RootLayout>
}

export default PrivacyPolicy
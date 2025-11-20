import { Head, usePage } from '@inertiajs/react'
import { PublicLayout } from '~/components/layouts/public-layout'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'

type PrivacyMessages = {
  title?: string
  h1?: string
  intro?: string
  section1Title?: string
  section1Body?: string
  section2Title?: string
  section2Body?: string
  section3Title?: string
  section3Body?: string
  section4Title?: string
  section4Body?: string
  section5Title?: string
  section5Body?: string
  contactText?: string
  contactEmail?: string
}

const PrivacyPolicy = () => {
  const { props } = usePage<{ messages?: PrivacyMessages }>()
  const m = props.messages || {}
  return (
    <>
      <Head title={m.title || 'Политика конфиденциальности'} />
      <div className="px-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{m.h1 || 'Политика конфиденциальности'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              {m.intro || 'В этой политике описано, какие данные собирает и как использует их сервис DataShift («Сервис»). Используя Сервис, вы соглашаетесь с обработкой данных в соответствии с настоящей политикой.'}
            </p>

            <Separator />

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">{m.section1Title || '1. Какие данные мы собираем'}</h2>
              <p>{m.section1Body || 'Мы можем собирать: информацию учетной записи (e‑mail, имя), технические метаданные о действиях в интерфейсе, логи ошибок и событий, а также данные, которые вы загружаете для работы с миграциями и датасетами.'}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">{m.section2Title || '2. Как мы используем данные'}</h2>
              <p>{m.section2Body || 'Данные используются для предоставления доступа к функциональности, улучшения качества Сервиса, диагностики проблем, обеспечения безопасности и соблюдения требований законодательства.'}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">{m.section3Title || '3. Хранение и защита'}</h2>
              <p>{m.section3Body || 'Мы предпринимаем разумные организационные и технические меры для защиты данных от несанкционированного доступа, изменения или уничтожения. Однако ни один метод передачи и хранения данных не может гарантировать абсолютную безопасность.'}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">{m.section4Title || '4. Ваши права'}</h2>
              <p>{m.section4Body || 'Вы можете запросить доступ к своим данным, их исправление или удаление, а также ограничение обработки. Для реализации прав свяжитесь с нами по контактам ниже.'}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">{m.section5Title || '5. Изменения политики'}</h2>
              <p>{m.section5Body || 'Мы можем время от времени обновлять политику конфиденциальности. Актуальная версия всегда доступна на этой странице.'}</p>
            </section>

            <Separator />

            <p>
              {(m.contactText || 'Контакты по вопросам конфиденциальности:')}{' '}
              <span className="text-foreground">{m.contactEmail || 'privacy@datashift.local'}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

PrivacyPolicy.layout = (page: React.ReactNode) => {
  return <PublicLayout>{page}</PublicLayout>
}

export default PrivacyPolicy
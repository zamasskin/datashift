import { Head } from '@inertiajs/react'
import { PublicLayout } from '~/components/layouts/public-layout'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'

const TermsOfService = () => {
  return (
    <>
      <Head title="Условия обслуживания" />
      <div className="px-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Условия обслуживания</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Настоящий документ описывает условия использования сервиса DataShift («Сервис»).
              Используя Сервис, вы подтверждаете согласие с данными условиями. Если вы не согласны с
              условиями, пожалуйста, прекратите использование Сервиса.
            </p>

            <Separator />

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">1. Общие положения</h2>
              <p>
                Сервис предоставляется «как есть». Мы стремимся обеспечить стабильную работу, однако
                не гарантируем отсутствие ошибок и перерывов в работе.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">2. Учетная запись и доступ</h2>
              <p>
                Для доступа к отдельным разделам может потребоваться учетная запись. Вы несете
                ответственность за сохранность учетных данных и действия, совершенные от вашего
                имени.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">3. Допустимое использование</h2>
              <p>
                Запрещено использовать Сервис для противоправной деятельности, нарушающей права и
                интересы третьих лиц, а также для попыток несанкционированного доступа к данным.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">4. Данные и контент</h2>
              <p>
                Вы сохраняете права на свой контент и данные. Предоставляя данные в Сервис, вы
                подтверждаете, что обладаете необходимыми правами и разрешениями на их
                использование.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">
                5. Ограничение ответственности
              </h2>
              <p>
                Мы не несем ответственности за косвенные убытки, упущенную выгоду, потерю данных и
                последствия использования Сервиса, за исключением случаев, прямо предусмотренных
                законом.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-foreground text-sm font-medium">6. Изменения условий</h2>
              <p>
                Мы можем обновлять условия обслуживания. Актуальная версия публикуется на этой
                странице. Продолжая использовать Сервис после изменений, вы принимаете обновленные
                условия.
              </p>
            </section>

            <Separator />

            <p>
              Контакты для вопросов по условиям:{' '}
              <span className="text-foreground">support@datashift.local</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

TermsOfService.layout = (page: React.ReactNode) => {
  return <PublicLayout title="Условия обслуживания">{page}</PublicLayout>
}

export default TermsOfService

import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'
import React from 'react'
import { useI18n } from '~/hooks/useI18nLocal'

const Settings = () => {
  const { t } = useI18n()
  return (
    <>
      <Head title={t('settings.title', 'Настройки')} />
      {t('settings.placeholder', 'Тут настройки')}
    </>
  )
}

function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  return <RootLayout title={t('settings.title', 'Настройки')}>{children}</RootLayout>
}

Settings.layout = (page: React.ReactNode) => {
  return <SettingsLayout>{page}</SettingsLayout>
}

export default Settings

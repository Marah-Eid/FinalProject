import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-center text-sm text-neutral-600 sm:flex-row sm:justify-between sm:px-6 sm:text-start">
        <p>{t('footer.tagline')}</p>
        <p className="text-neutral-500">{t('footer.rights')}</p>
      </div>
    </footer>
  )
}

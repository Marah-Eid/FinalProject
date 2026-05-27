import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <p className="mb-3 text-5xl font-bold text-brand-500">404</p>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">{t('errors.notFoundTitle')}</h1>
      <p className="mb-6 text-sm text-neutral-600">{t('errors.notFoundText')}</p>
      <Link to="/">
        <Button variant="primary">{t('errors.notFoundCta')}</Button>
      </Link>
    </div>
  )
}

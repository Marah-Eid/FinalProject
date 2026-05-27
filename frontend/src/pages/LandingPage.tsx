import { ArrowRight, Building2, ShieldCheck, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '../components/ui/Button'
import { useLanguage } from '../hooks/useLanguage'
import { cn } from '../utils/cn'

export function LandingPage() {
  const { t } = useTranslation()
  const { isRtl } = useLanguage()

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-brand-600">
              {t('landing.heroEyebrow')}
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-600 sm:text-lg">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/browse">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />}
                >
                  {t('landing.heroCtaPrimary')}
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  {t('landing.heroCtaSecondary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-neutral-900 sm:text-3xl">
            {t('landing.featuresTitle')}
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Feature
              icon={<Users className="h-6 w-6 text-brand-500" />}
              title={t('landing.feature1Title')}
              text={t('landing.feature1Text')}
            />
            <Feature
              icon={<Building2 className="h-6 w-6 text-brand-500" />}
              title={t('landing.feature2Title')}
              text={t('landing.feature2Text')}
            />
            <Feature
              icon={<ShieldCheck className="h-6 w-6 text-brand-500" />}
              title={t('landing.feature3Title')}
              text={t('landing.feature3Text')}
            />
          </div>
        </div>
      </section>
    </>
  )
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="text-sm leading-relaxed text-neutral-600">{text}</p>
    </div>
  )
}

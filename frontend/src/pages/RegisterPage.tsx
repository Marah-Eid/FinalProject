import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useAuth } from '../context/AuthContext'
import { extractApiError } from '../lib/http'
import { Gender, University, UserRole } from '../utils/types'

// Schema. Selects hold strings; we convert to numeric enums on submit so the
// form's input/output types stay aligned for useForm's generics.
const schema = z.object({
  fullName: z.string().min(2, { message: 'errors.field.tooShort' }).max(120),
  email: z.email({ message: 'errors.field.email' }),
  password: z
    .string()
    .min(8, { message: 'errors.field.passwordTooShort' })
    .max(128)
    .regex(/[A-Za-z]/, { message: 'errors.field.passwordNeedsLetter' })
    .regex(/\d/, { message: 'errors.field.passwordNeedsDigit' }),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s-]{6,40}$/, { message: 'errors.field.phone' }),
  role: z.string().refine((r) => r === String(UserRole.Student) || r === String(UserRole.Owner), {
    message: 'errors.field.required',
  }),
  gender: z.string().refine((g) => g === String(Gender.Male) || g === String(Gender.Female), {
    message: 'errors.field.required',
  }),
  // Optional university — empty string means "not selected".
  university: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const universityOptions: { code: keyof typeof University; value: University }[] = [
  { code: 'JU',   value: University.JU },
  { code: 'GJU',  value: University.GJU },
  { code: 'PSUT', value: University.PSUT },
  { code: 'YU',   value: University.YU },
  { code: 'HU',   value: University.HU },
  { code: 'MU',   value: University.MU },
  { code: 'ZU',   value: University.ZU },
  { code: 'BAU',  value: University.BAU },
  { code: 'JUST', value: University.JUST },
  { code: 'AAU',  value: University.AAU },
]

export function RegisterPage() {
  const { t } = useTranslation()
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { university: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await registerUser({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        phoneNumber: values.phoneNumber.trim(),
        role: Number(values.role) as UserRole,
        gender: Number(values.gender) as Gender,
        university: values.university ? (Number(values.university) as University) : undefined,
      })
      navigate('/dashboard', { replace: true })
    } catch (e) {
      const { message } = extractApiError(e)
      setServerError(message.startsWith('errors.') ? t(message) : message)
    }
  })

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <Card>
        <h1 className="mb-1 text-2xl font-bold text-neutral-900">{t('auth.registerTitle')}</h1>
        <p className="mb-6 text-sm text-neutral-600">{t('auth.registerSubtitle')}</p>

        {serverError && (
          <Alert tone="error" className="mb-4">
            {serverError}
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField
            htmlFor="fullName"
            label={t('fields.fullName')}
            error={errors.fullName && t(errors.fullName.message ?? 'errors.field.required')}
          >
            <Input id="fullName" autoFocus invalid={!!errors.fullName} {...register('fullName')} />
          </FormField>

          <FormField
            htmlFor="email"
            label={t('fields.email')}
            error={errors.email && t(errors.email.message ?? 'errors.field.required')}
          >
            <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
          </FormField>

          <FormField
            htmlFor="password"
            label={t('fields.password')}
            error={errors.password && t(errors.password.message ?? 'errors.field.required')}
            hint={t('errors.field.passwordTooShort')}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.password}
              {...register('password')}
            />
          </FormField>

          <FormField
            htmlFor="phoneNumber"
            label={t('fields.phoneNumber')}
            error={errors.phoneNumber && t(errors.phoneNumber.message ?? 'errors.field.required')}
          >
            <Input
              id="phoneNumber"
              type="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="+962 7…"
              invalid={!!errors.phoneNumber}
              {...register('phoneNumber')}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              htmlFor="role"
              label={t('fields.role')}
              error={errors.role && t(errors.role.message ?? 'errors.field.required')}
            >
              <Select id="role" invalid={!!errors.role} defaultValue="" {...register('role')}>
                <option value="" disabled>{t('auth.selectRole')}</option>
                <option value={UserRole.Student}>{t('roles.student')}</option>
                <option value={UserRole.Owner}>{t('roles.owner')}</option>
              </Select>
            </FormField>

            <FormField
              htmlFor="gender"
              label={t('fields.gender')}
              error={errors.gender && t(errors.gender.message ?? 'errors.field.required')}
            >
              <Select id="gender" invalid={!!errors.gender} defaultValue="" {...register('gender')}>
                <option value="" disabled>{t('auth.selectGender')}</option>
                <option value={Gender.Male}>{t('gender.male')}</option>
                <option value={Gender.Female}>{t('gender.female')}</option>
              </Select>
            </FormField>
          </div>

          <FormField
            htmlFor="university"
            label={t('fields.university')}
            optional
            hint={t('auth.universityHelp')}
            error={errors.university && t(errors.university.message ?? 'errors.field.required')}
          >
            <Select id="university" invalid={!!errors.university} defaultValue="" {...register('university')}>
              <option value="">—</option>
              {universityOptions.map((u) => (
                <option key={u.code} value={u.value}>
                  {t(`universities.${u.code}`)}
                </option>
              ))}
            </Select>
          </FormField>

          <Button type="submit" variant="primary" block loading={isSubmitting}>
            {t('auth.registerSubmit')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            {t('auth.logInHere')}
          </Link>
        </p>
      </Card>
    </div>
  )
}

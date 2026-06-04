'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/axios/auth'
import { LoginSchema, type Login } from '@/lib/schemas/auth.schema'
import { useAuthStore } from '@/lib/store/auth.store'

export default function LoginPage() {
  const router = useRouter()
  const { setTokens } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Login>({
    resolver: zodResolver(LoginSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: Login) => {
    setIsLoading(true)
    try {
      const { accessToken, refreshToken, user } = await authApi.login(data)
      setTokens(accessToken, refreshToken, user)
      console.log(user)
      if (user.roleName === 'ADMIN') {
        router.push('/backoffice')
      }else{
      router.push('/dashboard')
      }
    } catch {
      // errore già gestito dall'interceptor axios
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black">
      <div className="card bg-base-100 w-full max-w-md shadow-sm">
        <div className="card-body gap-4">
          <h2 className="card-title text-2xl">Accedi</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email</legend>
              <input
                type="email"
                placeholder="mario@example.com"
                className={`input w-full ${errors.email ? 'input-error' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="fieldset-label text-error">{errors.email.message}</p>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Password</legend>
              <input
                type="password"
                placeholder="la tua password"
                className={`input w-full ${errors.password ? 'input-error' : ''}`}
                {...register('password')}
              />
              {errors.password && (
                <p className="fieldset-label text-error">{errors.password.message}</p>
              )}
            </fieldset>

            <button
              type="submit"
              className="btn btn-primary mt-2"
              // disabled={isLoading}
            >
              {/* {isLoading ? <span className="loading loading-spinner loading-sm" /> : 'Accedi'} */}
              Accedi
            </button>
          </form>

          <p className="text-sm text-center text-base-content/60">
            Non hai un account?{' '}
            <a href="/register" className="link link-primary">Registrati</a>
          </p>
        </div>
      </div>
    </main>
  )
}
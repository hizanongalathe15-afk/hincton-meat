import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, ArrowLeft, Shield, Key, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import { HINCTON_BRAND } from '../utils/hinctonBrand'
import { useLanguage } from '../contexts/LanguageContext'

const ResetPasswordPage: React.FC<{ onNavigate?: (page: 0 | 1 | 2 | 3) => void }> = ({ onNavigate }) => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const token = params.get('token') || ''
  const { t } = useLanguage()
  const { profile } = useSiteContent()
  const brand = profile.brand

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!token) {
      toast.error(t('reset.tokenMissing'))
      return
    }

    if (password !== confirmPassword) {
      toast.error(t('reset.passwordsDoNotMatch'))
      return
    }

    if (password.length < 8) {
      toast.error(t('reset.passwordTooShort'))
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPassword({ token, password })
      toast.success(t('reset.passwordResetSuccess'))
      if (onNavigate) {
        onNavigate(0) // login
      } else {
        navigate('/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-experience min-h-screen bg-black relative overflow-hidden">
      {/* Blurred Background Image */}
      <div className="absolute inset-0">
        <div
          className="size-full bg-cover bg-center scale-110 blur-2xl brightness-50"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWF0JTIwc3RhZ2UlMjB3aXRoJTIwZmluZSUyMGRpbmluZyUyMHRvb2xzfGVufDF8fHx8MTc3ODM1OTYwOXww&ixlib=rb-4.1.0&q=80&w=1080)',
          }}
        />
      </div>

      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 left-0 hidden h-96 w-96 rounded-full bg-gradient-to-br from-red-600/30 to-white/10 blur-3xl sm:block sm:animate-pulse" />
      <div className="absolute bottom-0 right-0 hidden h-96 w-96 rounded-full bg-gradient-to-br from-white/10 to-red-600/30 blur-3xl sm:block sm:animate-pulse" />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-5xl">
          {/* Card Container */}
          <div className="relative">
            {/* Animated Border Gradient */}
            <div className="auth-halo absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-red-600 via-white to-red-600 opacity-25 blur sm:animate-spin" style={{animationDuration: '20s'}} />

            {/* Main Card */}
            <div className="auth-card relative bg-zinc-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-red-600/20 overflow-hidden">
              <div className="grid lg:grid-cols-2">
                {/* Left Side - Decorative */}
                <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
                  {/* Decorative Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-32 h-32 border-2 border-red-500 rounded-full animate-spin"
                        style={{
                          top: `${(i * 15) % 100}%`,
                          left: `${(i * 25) % 100}%`,
                          animationDuration: `${15 + i * 2}s`,
                          animationDelay: `${i * 0.5}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Logo and Title */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="relative">
                        <div className="relative bg-white p-3 rounded-3xl shadow-lg">
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name || ''} className="h-14 w-14 object-contain" />
                          ) : (
                            <div className="h-14 w-14 rounded-3xl border border-stone-200 bg-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white">{brand.name || ''}</h2>
                        <p className="text-red-400">{brand.tagline || ''}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mt-8">
                      <h3 className="text-4xl font-bold text-white leading-tight">
                        {t('reset.secureAccountRecovery')}
                        <br />
                        {t('reset.recovery')}
                      </h3>
                      <p className="text-gray-400 text-lg">
                        {t('reset.recoveryDescription')}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="relative z-10 space-y-4">
                    {[
                      { icon: Shield, text: t('reset.enhancedSecurity') },
                      { icon: Key, text: t('reset.strongPassword') },
                      { icon: CheckCircle, text: t('reset.accountProtection') },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 text-gray-300">
                        <item.icon className="w-6 h-6 text-red-400" />
                        <span className="font-medium">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 lg:p-12">
                  {/* Back Button */}
                  <button
                    onClick={() => onNavigate ? onNavigate(0) : navigate('/login')}
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 bg-transparent border-none cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('reset.backToSignIn')}
                  </button>

                  {/* Welcome Text */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">{t('reset.newPassword')}</h1>
                    <p className="text-gray-400">
                      {t('reset.newPasswordDescription')}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                      <input
                        id="reset-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('reset.newPasswordPlaceholder')}
                        required
                        minLength={8}
                        className="w-full pl-12 pr-12 py-4 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/20 to-white/10 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur" />
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                      <input
                        id="reset-confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('reset.confirmNewPasswordPlaceholder')}
                        required
                        minLength={8}
                        className="w-full pl-12 pr-12 py-4 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/20 to-white/10 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur" />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !token}
                      className="relative w-full py-4 rounded-xl font-semibold text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative z-10">
                        {isLoading ? t('reset.resettingPassword') : t('reset.resetPassword')}
                      </span>
                    </button>
                  </form>

                  {/* Help Text */}
                  <p className="text-center mt-6 text-gray-400 text-sm">
                    {t('reset.rememberPassword')}{' '}
                    <button
                      onClick={() => onNavigate ? onNavigate(0) : navigate('/login')}
                      className="text-red-500 hover:text-red-400 transition-colors font-semibold bg-transparent border-none cursor-pointer"
                    >
                      {t('reset.signInHere')}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage

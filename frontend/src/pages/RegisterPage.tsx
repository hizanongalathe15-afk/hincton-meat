import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Github, Lock, Mail, User, Truck, Star, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { HINCTON_BRAND } from '../utils/hinctonBrand'
import { useLanguage } from '../contexts/LanguageContext'
import { getApiHost } from '../services/api'

const RegisterPage: React.FC<{ onNavigate?: (page: 0 | 1 | 2 | 3) => void }> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreed: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showTermsError, setShowTermsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target
    setFormData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    if (name === 'agreed' && checked) setShowTermsError(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.agreed) {
      setShowTermsError(true)
      toast.error(t('register.termsAgreementError'))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('register.passwordsDoNotMatch'))
      return
    }

    if (formData.password.length < 8) {
      toast.error(t('register.passwordTooShort'))
      return
    }

    setIsLoading(true)
    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        agreed: formData.agreed,
      })
      navigate('/profile')
    } catch (error: any) {
      toast.error(error.message || t('register.registrationFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    const baseUrl = getApiHost()
    if (!baseUrl) {
      toast.error(`${t('login.socialLoginNotConfigured').replace('{provider}', provider)}`)
      return
    }
    const redirectOrigin = encodeURIComponent(window.location.origin)
    window.location.href = `${baseUrl}/api/auth/${provider.toLowerCase()}?redirect=${redirectOrigin}`
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
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
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-600/30 to-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-red-600/30 rounded-full blur-3xl animate-pulse" />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-5xl">
          {/* Card Container */}
          <div className="relative">
            {/* Animated Border Gradient */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-white to-red-600 rounded-3xl blur opacity-30 animate-spin" style={{animationDuration: '20s'}} />

            {/* Main Card */}
            <div className="relative bg-zinc-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-red-600/20 overflow-hidden">
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
                          <img src={HINCTON_BRAND.logo} alt={HINCTON_BRAND.name} className="h-14 w-14 object-contain" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white">{HINCTON_BRAND.name}</h2>
                        <p className="text-red-400">{HINCTON_BRAND.tagline}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mt-8">
                      <h3 className="text-4xl font-bold text-white leading-tight">
                        {t('register.joinOurCommunity')}
                        <br />
                        {t('register.meatCommunity')}
                      </h3>
                      <p className="text-gray-400 text-lg">
                        {t('register.communityDescription')}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="relative z-10 space-y-4">
                    {[
                      { icon: Shield, text: t('register.premiumQualityMeats') },
                      { icon: Truck, text: t('register.freshDeliveryService') },
                      { icon: Star, text: t('register.vipMemberBenefits') },
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
                  {/* Welcome Text */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">{t('register.joinUsToday')}</h1>
                    <p className="text-gray-400">
                      {t('register.createAccountDescription')}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                        <input
                          id="register-first-name"
                          type="text"
                          name="firstName"
                          autoComplete="given-name"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder={t('register.firstName')}
                          required
                          className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-all"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/20 to-white/10 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur" />
                      </div>

                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                        <input
                          id="register-last-name"
                          type="text"
                          name="lastName"
                          autoComplete="family-name"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder={t('register.lastName')}
                          required
                          className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-all"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/20 to-white/10 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur" />
                      </div>
                    </div>

                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                      <input
                        id="register-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('register.emailPlaceholder')}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-all"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/20 to-white/10 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur" />
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={t('register.passwordPlaceholder')}
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
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder={t('register.confirmPasswordPlaceholder')}
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

                    {/* Terms Agreement */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="agreed"
                        name="agreed"
                        checked={formData.agreed}
                        onChange={handleChange}
                        className="mt-1 rounded accent-red-600"
                        aria-describedby={showTermsError ? 'terms-error' : undefined}
                        aria-invalid={showTermsError ? 'true' : 'false'}
                      />
                      <label htmlFor="agreed" className="text-sm text-gray-400 leading-relaxed">
                        {t('register.agreeToTerms')}{' '}
                        <Link to="/terms" className="text-red-500 hover:text-red-400 underline">
                          {t('register.termsAndConditions')}
                        </Link>{' '}
                        {t('register.and')}{' '}
                        <Link to="/privacy" className="text-red-500 hover:text-red-400 underline">
                          {t('register.privacyPolicy')}
                        </Link>
                      </label>
                    </div>
                    {showTermsError && (
                      <p id="terms-error" className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                        {t('register.termsAgreementError')}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="relative w-full py-4 rounded-xl font-semibold text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative z-10">
                        {isLoading ? t('register.creatingAccount') : t('register.createAccount')}
                      </span>
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-zinc-900 text-gray-500 text-sm">{t('login.or')}</span>
                    </div>
                  </div>

                  {/* Social Login */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSocialLogin('Google')}
                      className="flex items-center justify-center gap-3 py-3 px-4 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 rounded-xl text-gray-300 hover:text-white transition-all hover:scale-105"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {t('login.google')}
                    </button>
                    <button
                      onClick={() => handleSocialLogin('GitHub')}
                      className="flex items-center justify-center gap-3 py-3 px-4 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 rounded-xl text-gray-300 hover:text-white transition-all hover:scale-105"
                    >
                      <Github className="w-5 h-5" />
                      {t('login.github')}
                    </button>
                  </div>

                  {/* Sign In Link */}
                  <p className="text-center mt-6 text-gray-400">
                    {t('register.alreadyHaveAccount')}{' '}
                    <button
                      onClick={() => onNavigate ? onNavigate(0) : navigate('/login')}
                      className="text-red-500 hover:text-red-400 transition-colors font-semibold bg-transparent border-none cursor-pointer"
                    >
                      {t('register.signInHere')}
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

export default RegisterPage

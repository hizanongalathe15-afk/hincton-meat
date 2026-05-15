import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Github, KeyRound, Lock, Mail, Smartphone, Truck, Star, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import PhoneNumberInput from '../components/ui/PhoneNumberInput'
import { HINCTON_BRAND } from '../utils/hinctonBrand'
import { isValidE164PhoneNumber } from '../utils/phoneCountries'
import { useLanguage } from '../contexts/LanguageContext'
import { getApiHost } from '../services/api'

const LoginPage: React.FC<{ onNavigate?: (page: 0 | 1 | 2 | 3) => void }> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({ email: '', password: '', remember: false })
  const [phoneData, setPhoneData] = useState({ phone: '', otp: '' })
  const [authMode, setAuthMode] = useState<'password' | 'phone'>('password')
  const [otpRequested, setOtpRequested] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, requestPhoneOtp, verifyPhoneOtp } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target
    setFormData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      navigate(user.role === 'admin' || user.role === 'ADMIN' ? '/admin/dashboard' : '/profile')
    } catch {
      // AuthContext already shows the API error as a toast.
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestOtp = async () => {
    if (!isValidE164PhoneNumber(phoneData.phone)) {
      toast.error(t('validation.validPhoneWithCode'))
      return
    }

    setIsLoading(true)
    try {
      const response = await requestPhoneOtp(phoneData.phone)
      if (response?.devOtp) {
        toast(`Development OTP: ${response.devOtp}`)
      }
      setOtpRequested(true)
    } catch {
      // AuthContext already shows the API error as a toast.
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!phoneData.otp || phoneData.otp.length !== 6) {
      toast.error(t('validation.validOtp'))
      return
    }

    setIsLoading(true)
    try {
      await verifyPhoneOtp(phoneData.phone, phoneData.otp)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      navigate(user.role === 'admin' || user.role === 'ADMIN' ? '/admin/dashboard' : '/profile')
    } catch {
      // AuthContext already shows the API error as a toast.
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    if (onNavigate) {
      onNavigate(2) // forgot
    } else {
      navigate('/forgot-password')
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
                        {t('login.freshPremium')}
                        <br />
                        {t('login.meatSelection')}
                      </h3>
                      <p className="text-gray-400 text-lg">
                        {t('login.communityDescription')}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="relative z-10 space-y-4">
                    {[
                      { icon: Shield, text: t('login.premiumQuality') },
                      { icon: Truck, text: t('login.freshDelivery') },
                      { icon: Star, text: t('login.vipBenefits') },
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
                  {/* Tab Switcher */}
                  <div className="flex bg-zinc-800/50 rounded-xl p-1 mb-8">
                    <button
                      onClick={() => setAuthMode('password')}
                      className={`relative flex-1 py-3 px-6 rounded-xl transition-all duration-300 ${
                        authMode === 'password' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {t('login.password')}
                      </span>
                    </button>
                    <button
                      onClick={() => setAuthMode('phone')}
                      className={`relative flex-1 py-3 px-6 rounded-xl transition-all duration-300 ${
                        authMode === 'phone' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        {t('login.phoneOtp')}
                      </span>
                    </button>
                  </div>

                  {/* Welcome Text */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">{t('login.welcomeBack')}</h1>
                    <p className="text-gray-400">
                      {authMode === 'password'
                        ? t('login.signInDescription')
                        : t('login.phoneOtpDescription')}
                    </p>
                  </div>

                  {/* Form */}
                  {authMode === 'password' ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                        <input
                          id="login-email"
                          name="email"
                          type="email"
                          autoComplete="username"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-all"
                          placeholder={t('login.emailPlaceholder')}
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/20 to-white/10 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur" />
                      </div>

                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                        <input
                          id="login-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full pl-12 pr-12 py-4 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-all"
                          placeholder={t('login.passwordPlaceholder')}
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

                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.remember}
                            onChange={handleChange}
                            name="remember"
                            className="rounded accent-red-600"
                          />
                          {t('login.rememberMe')}
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          {t('login.forgotPassword')}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="relative w-full py-4 rounded-xl font-semibold text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10">
                          {isLoading ? t('login.signingIn') : t('login.signIn')}
                        </span>
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-5">
                      {!otpRequested ? (
                        <>
                          <div className="relative group">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                            <div className="pl-12">
                              <PhoneNumberInput
                                id="phone"
                                label=""
                                value={phoneData.phone}
                                onChange={(value) => setPhoneData(prev => ({ ...prev, phone: value }))}
                                required
                              />
                            </div>
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/20 to-white/10 opacity-0 focus-within:opacity-100 transition-opacity -z-10 blur" />
                          </div>

                          <button
                            onClick={handleRequestOtp}
                            disabled={isLoading}
                            className="relative w-full py-4 rounded-xl font-semibold text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10">
                              {isLoading ? t('login.sendingOtp') : t('login.sendOtp')}
                            </span>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="relative group">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                            <input
                              type="text"
                              value={phoneData.otp}
                              onChange={(e) => setPhoneData(prev => ({ ...prev, otp: e.target.value }))}
                              className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-all"
                              placeholder={t('login.enterOtp')}
                              maxLength={6}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/20 to-white/10 opacity-0 focus-within:opacity-100 transition-opacity -z-10 blur" />
                          </div>

                          <button
                            onClick={handleVerifyOtp}
                            disabled={isLoading}
                            className="relative w-full py-4 rounded-xl font-semibold text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10">
                              {isLoading ? t('login.verifying') : t('login.verifyOtp')}
                            </span>
                          </button>

                          <button
                            onClick={() => setOtpRequested(false)}
                            className="w-full text-gray-400 hover:text-white transition-colors text-sm"
                          >
                            {t('login.changePhone')}
                          </button>
                        </>
                      )}
                    </div>
                  )}

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

                  {/* Sign Up Link */}
                  <p className="text-center mt-6 text-gray-400">
                    {t('login.noAccount')}{' '}
                    <button
                      onClick={() => onNavigate ? onNavigate(1) : navigate('/register')}
                      className="text-red-500 hover:text-red-400 transition-colors font-semibold bg-transparent border-none cursor-pointer"
                    >
                      {t('login.signUpHere')}
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

export default LoginPage

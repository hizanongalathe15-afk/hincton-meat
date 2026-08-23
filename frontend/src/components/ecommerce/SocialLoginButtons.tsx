import React from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

type SocialLoginMode = 'login' | 'register'

type SocialLoginButtonsProps = {
  mode?: SocialLoginMode
  className?: string
}

type ProviderKey = 'google' | 'facebook' | 'apple'

type ProviderConfig = {
  key: ProviderKey
  label: string
  brandColor: string
  hoverColor: string
  borderColor: string
  textColor: string
  logo: React.ReactNode
}

const PROVIDERS: ProviderConfig[] = [
  {
    key: 'google',
    label: 'Google',
    brandColor: 'bg-white',
    hoverColor: 'hover:bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-800',
    logo: (
      <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2c-2 1.4-4.6 2.3-7.3 2.3-5.2 0-9.6-3.3-11.1-7.8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4 5.5l6.2 5.2C41.3 35.3 44 30.1 44 24c0-1.2-.1-2.4-.4-3.5z" />
      </svg>
    ),
  },
  {
    key: 'facebook',
    label: 'Facebook',
    brandColor: 'bg-[#1877F2]',
    hoverColor: 'hover:bg-[#145DBD]',
    borderColor: 'border-[#1877F2]',
    textColor: 'text-white',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
        <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.3-1.5 1.6-1.5h1.5V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 3.9v2.4H7.5v3h2.5V21h3.5z" />
      </svg>
    ),
  },
  {
    key: 'apple',
    label: 'Apple',
    brandColor: 'bg-black',
    hoverColor: 'hover:bg-gray-900',
    borderColor: 'border-black',
    textColor: 'text-white',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
        <path d="M16.365 1.43c0 1.14-.41 2.22-1.23 3.01-.87.84-2.15 1.49-3.28 1.4-.15-1.1.42-2.25 1.22-3.02.86-.85 2.28-1.49 3.29-1.39zm3.59 16.93c-.75 1.7-1.54 3.39-3.14 3.42-1.49.02-1.95-.98-3.62-.98-1.69 0-2.19.96-3.52.99-1.41.03-2.49-1.82-3.24-3.52-1.6-3.63-2.82-10.27 1.06-13.65C8.94 3.03 10.24 2.6 11.47 2.57c1.38-.03 2.68.93 3.52.93.83 0 2.41-1.14 4.05-.97.69.02 2.63.27 3.88 2.07-.09.05-2.41 1.39-2.38 4.15.04 3.4 2.9 4.52 2.92 4.52-.02.06-.53 1.84-1.59 4.09z" />
      </svg>
    ),
  },
]

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  mode = 'login',
  className = '',
}) => {
  const auth = useAuth()

  const handleProviderClick = (provider: ProviderKey) => {
    const providerName = PROVIDERS.find(p => p.key === provider)?.label || provider
    const verb = mode === 'register' ? 'register' : 'sign in'

    toast(
      (t) => (
        <div className="flex items-start gap-3 max-w-xs">
          <div className="shrink-0 p-2 rounded-lg bg-amber-100 text-amber-700">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M12 2L1.5 22h21L12 2zm0 5.5l7.5 13.5h-15L12 7.5zM11 10v5h2v-5h-2zm0 6v2h2v-2h-2z" />
            </svg>
          </div>
          <div className="text-sm">
            <div className="font-semibold text-gray-900">{providerName} not connected</div>
            <div className="text-gray-600 mt-0.5">
              Configure this {providerName} OAuth provider in admin settings to enable {verb}.
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="text-xs font-semibold px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: 5000 },
    )

    try {
      window.alert(
        `${providerName} ${mode === 'register' ? 'registration' : 'login'} is a placeholder.\n\n` +
        `Action: dispatch auth context social login for provider "${provider}".\n` +
        `To enable, configure the ${providerName} OAuth provider in the settings panel.`,
      )
    } catch {
    }

    try {
      void auth
    } catch {
    }
  }

  return (
    <div className={`w-full space-y-3 ${className}`}>
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Or {mode === 'register' ? 'sign up' : 'continue'} with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.key}
            type="button"
            onClick={() => handleProviderClick(provider.key)}
            className={`inline-flex items-center justify-center gap-2 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all ${provider.brandColor} ${provider.hoverColor} ${provider.borderColor} ${provider.textColor}`}
            aria-label={`${mode === 'register' ? 'Sign up' : 'Continue'} with ${provider.label}`}
          >
            {provider.logo}
            <span className="hidden sm:inline">{provider.label}</span>
            <span className="sm:hidden">{provider.label.slice(0, 3)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SocialLoginButtons

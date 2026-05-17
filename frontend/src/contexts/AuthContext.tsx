import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'
import { getApiHost } from '../services/api'

interface User {
  id: string
  name: string
  email: string
  username?: string
  role: 'admin' | 'buyer'
  phone?: string
  avatar?: string
  profile?: {
    firstName?: string
    lastName?: string
    fullName?: string
    avatar?: string
    coverImage?: string
    bio?: string
    website?: string
    mpesaPhone?: string
    preferredDeliveryLocation?: string
    locationLabel?: string
    preferredLanguage?: string
  }
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  isVerified: boolean
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  requestPhoneOtp: (phone: string) => Promise<any>
  verifyPhoneOtp: (phone: string, otp: string) => Promise<void>
  register: (userData: any) => Promise<any>
  logout: () => void
  updateProfile: (userData: any) => Promise<void>
  updateAvatar: (file: File) => Promise<User>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const getTokenSessionId = () => {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    return payload.sessionId || null
  } catch {
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordChangedWarning, setPasswordChangedWarning] = useState(false)

  useEffect(() => {
    if (!user?.id) return undefined

    const socket: Socket = io(getApiHost(), { withCredentials: true })
    socket.emit('presence:join', { userId: user.id })
    socket.on('account:password-changed', (payload: { currentSessionId?: string; message?: string }) => {
      if (payload.currentSessionId && payload.currentSessionId === getTokenSessionId()) return
      setPasswordChangedWarning(true)
      toast.error(payload.message || 'Your password was changed. Please log out and sign in again.')
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.id])

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const tokenFromUrl = params.get('token')
        if (tokenFromUrl) {
          localStorage.setItem('token', tokenFromUrl)
          params.delete('token')
          const cleanedUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`
          window.history.replaceState({}, '', cleanedUrl)
        }
      }

      const token = localStorage.getItem('token')
      if (token) {
        const cachedUser = localStorage.getItem('user')
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser))
          } catch {
            localStorage.removeItem('user')
          }
        }

        try {
          const userData = await authService.getProfile()
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        } catch (error: any) {
          console.error('Auth init error:', error)
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
          }
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      if (!email.trim() || !password) {
        throw new Error('Please enter both your email address and password to log in.')
      }

      const response = await authService.login({ email, password })
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      if (response.user?.role === 'admin' || response.user?.role === 'ADMIN') {
        sessionStorage.setItem('hincton:admin-welcome-pending', 'true')
      }
      setUser(response.user)
      toast.success(response.message || 'Login successful. Welcome back!')
    } catch (error: any) {
      const rawMessage = String(error.message || '').toLowerCase()
      const message =
        rawMessage.includes('invalid') || rawMessage.includes('credential') || rawMessage.includes('password') || rawMessage.includes('email')
          ? 'Hincton secure access could not verify those details. Check the email and password, then try again.'
          : rawMessage.includes('locked') || rawMessage.includes('too many')
            ? 'This account is protected after repeated failed attempts. Please wait, reset the password, or contact admin support.'
            : error.message || 'Hincton secure access could not complete login. Please try again.'
      toast.error(message)
      throw error
    }
  }

  const requestPhoneOtp = async (phone: string) => {
    try {
      const response = await authService.requestPhoneOtp({ phone })
      toast.success('OTP sent to your phone')
      return response
    } catch (error: any) {
      toast.error(error.message || 'Could not send OTP')
      throw error
    }
  }

  const verifyPhoneOtp = async (phone: string, otp: string) => {
    try {
      const response = await authService.verifyPhoneOtp({ phone, otp })
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      setUser(response.user)
      toast.success('Phone verified. Welcome back!')
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed')
      throw error
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await authService.register(userData)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      setUser(response.user)
      toast.success(response.message || 'Registration successful!')
      return response
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateProfile = async (userData: any) => {
    try {
      const updatedUser = await authService.updateProfile(userData)
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Profile update failed')
      throw error
    }
  }

  const updateAvatar = async (file: File) => {
    try {
      const updatedUser = await authService.updateAvatar(file)
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      toast.success('Profile image updated successfully!')
      return updatedUser
    } catch (error: any) {
      toast.error(error.message || 'Profile image update failed')
      throw error
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authService.changePassword(currentPassword, newPassword)
      toast.success('Password changed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Password change failed')
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    requestPhoneOtp,
    verifyPhoneOtp,
    register,
    logout,
    updateProfile,
    updateAvatar,
    changePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {passwordChangedWarning && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4" role="alertdialog" aria-modal="true" aria-labelledby="password-changed-title">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 id="password-changed-title" className="text-xl font-bold text-gray-950">Password changed</h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              This account password was changed from another signed-in device. For security, this session should be closed and you need to sign in again with the new password.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Log out now
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

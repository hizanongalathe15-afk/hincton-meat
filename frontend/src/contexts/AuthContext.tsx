import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

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
  register: (userData: any) => Promise<void>
  logout: () => void
  updateProfile: (userData: any) => Promise<void>
  updateAvatar: (file: File) => Promise<void>
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
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
      setUser(response.user)
      toast.success(response.message || 'Login successful. Welcome back!')
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials and try again.')
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
      toast.success('Registration successful!')
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

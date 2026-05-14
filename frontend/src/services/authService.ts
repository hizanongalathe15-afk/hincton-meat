import api, { getApiErrorMessage } from './api'
import { ForgotPasswordData, LoginData, RegisterData, RequestPhoneOtpData, ResetPasswordData, UpdateProfileData, User, VerifyPhoneOtpData } from '../types/user'

const normalizeAuthError = (error: any) => {
  return new Error(getApiErrorMessage(error, 'Authentication failed. Please try again.'))
}

export const authService = {
  async register(userData: RegisterData) {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      throw normalizeAuthError(error)
    }
  },

  async login(credentials: LoginData) {
    try {
      const response = await api.post('/auth/login', credentials)
      return response.data
    } catch (error) {
      throw normalizeAuthError(error)
    }
  },

  async requestPhoneOtp(data: RequestPhoneOtpData) {
    try {
      const response = await api.post('/auth/phone/request-otp', data)
      return response.data
    } catch (error) {
      throw normalizeAuthError(error)
    }
  },

  async verifyPhoneOtp(data: VerifyPhoneOtpData) {
    try {
      const response = await api.post('/auth/phone/verify-otp', data)
      return response.data
    } catch (error) {
      throw normalizeAuthError(error)
    }
  },

  async forgotPassword(data: ForgotPasswordData) {
    try {
      const response = await api.post('/auth/forgot-password', data)
      return response.data
    } catch (error) {
      throw normalizeAuthError(error)
    }
  },

  async resetPassword(data: ResetPasswordData) {
    try {
      const response = await api.post('/auth/reset-password', data)
      return response.data
    } catch (error) {
      throw normalizeAuthError(error)
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await api.get('/auth/profile')
      return response.data.user || response.data
    } catch (error) {
      console.error('Get profile error:', error)
      throw error
    }
  },

  async updateProfile(userData: UpdateProfileData): Promise<User> {
    const response = await api.put('/auth/profile', userData)
    return response.data.user
  },

  async updatePreferredLanguage(language: string): Promise<User> {
    const response = await api.put('/auth/profile/language', { language })
    return response.data.user
  },

  async updateAvatar(file: File): Promise<User> {
    const data = new FormData()
    data.append('avatar', file)
    const response = await api.post('/auth/profile/avatar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.user
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  },
}

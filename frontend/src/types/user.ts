export interface User {
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
    coordinates?: {
      lat: number
      lng: number
    }
  }
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
}

export interface LoginData {
  email: string
  password: string
}

export interface RequestPhoneOtpData {
  phone: string
}

export interface VerifyPhoneOtpData {
  phone: string
  otp: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  password: string
}

export interface UpdateProfileData {
  name?: string
  firstName?: string
  lastName?: string
  username?: string
  phone?: string
  avatar?: string
  coverImage?: string
  bio?: string
  website?: string
  preferredLanguage?: string
  preferredDeliveryLocation?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
}

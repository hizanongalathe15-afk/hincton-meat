import { format, formatDistanceToNow } from 'date-fns'

export type CurrencySettings = {
  currencyCode?: string
  currencySymbol?: string
  locale?: string
}

export const formatCurrency = (
  amount: number,
  currency: CurrencySettings = {}
): string => {
  const { currencySymbol = 'KSh', locale = 'en-KE' } = currency

  // We keep cents out (same as existing UI) unless you later want decimals.
  return `${currencySymbol} ${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`
}


export const formatDate = (date: string | Date, formatStr = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr)
}

export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const generateOrderNumber = (): string => {
  return 'ORD' + Date.now().toString().slice(-6)
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

export const calculateDiscount = (originalPrice: number, discountPercentage: number): number => {
  return originalPrice * (1 - discountPercentage / 100)
}

export const calculateDeliveryFee = (subtotal: number): number => {
  const DELIVERY_FEE = 150
  const FREE_DELIVERY_THRESHOLD = 2000
  
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

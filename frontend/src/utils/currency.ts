// Currency utilities for Kenyan Shillings
export const CURRENCY = 'KSH'
export const CURRENCY_SYMBOL = 'KSh'
export const USD_TO_KSH_RATE = 130 // Approximate conversion rate

// Format price in KSH
export const formatPrice = (price: number): string => {
  return `${CURRENCY_SYMBOL} ${price.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`
}

// Convert USD to KSH
export const convertUSDToKSH = (usdPrice: number): number => {
  return Math.round(usdPrice * USD_TO_KSH_RATE)
}

// Format price with conversion from USD
export const formatPriceFromUSD = (usdPrice: number): string => {
  const kshPrice = convertUSDToKSH(usdPrice)
  return formatPrice(kshPrice)
}

// Get price ranges for filters in KSH
export const getPriceRanges = () => [
  { id: '0-1000', name: 'Under KSh 1,000', min: 0, max: 1000 },
  { id: '1000-3000', name: 'KSh 1,000 - KSh 3,000', min: 1000, max: 3000 },
  { id: '3000-6000', name: 'KSh 3,000 - KSh 6,000', min: 3000, max: 6000 },
  { id: '6000-13000', name: 'KSh 6,000 - KSh 13,000', min: 6000, max: 13000 },
  { id: '13000+', name: 'Over KSh 13,000', min: 13000, max: Infinity }
]

// Parse price range string
export const parsePriceRange = (rangeId: string) => {
  const ranges = getPriceRanges()
  return ranges.find(range => range.id === rangeId)
}

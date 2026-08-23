export const MEAT_CATEGORIES = [
  'Beef',
  'Goat',
  'Chicken',
  'Lamb/Mutton',
  'Fish',
  'Pet Food',
  'Processed Products'
] as const

export const WEIGHT_UNITS = ['kg', 'g', 'lbs'] as const

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'confirmed', label: 'Confirmed', color: 'info' },
  { value: 'preparing', label: 'Preparing', color: 'primary' },
  { value: 'ready', label: 'Ready', color: 'success' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'primary' },
  { value: 'delivered', label: 'Delivered', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'danger' }
] as const

export const PAYMENT_METHODS = [
  { value: 'mpesa', label: 'M-PESA', icon: Smartphone },
  { value: 'cash', label: 'Cash on Delivery', icon: Banknote },
  { value: 'card', label: 'Credit/Debit Card', icon: CreditCard }
] as const

export const DELIVERY_STATUSES = [
  { value: 'assigned', label: 'Assigned', color: 'info' },
  { value: 'picked_up', label: 'Picked Up', color: 'primary' },
  { value: 'in_transit', label: 'In Transit', color: 'warning' },
  { value: 'delivered', label: 'Delivered', color: 'success' },
  { value: 'failed', label: 'Failed', color: 'danger' }
] as const

export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'name', label: 'Name: A to Z' }
] as const

export const PRICE_RANGES = [
  { min: 0, max: 500, label: 'Under KES 500' },
  { min: 500, max: 1000, label: 'KES 500 - 1000' },
  { min: 1000, max: 2000, label: 'KES 1000 - 2000' },
  { min: 2000, max: Infinity, label: 'Over KES 2000' }
] as const

export const WEIGHT_RANGES = [
  { min: 0, max: 1, label: 'Under 1kg' },
  { min: 1, max: 2, label: '1kg - 2kg' },
  { min: 2, max: 5, label: '2kg - 5kg' },
  { min: 5, max: Infinity, label: 'Over 5kg' }
] as const

export const DELIVERY_FEE = 150

export const FREE_DELIVERY_THRESHOLD = 2000
import { Banknote, CreditCard, Smartphone } from 'lucide-react'

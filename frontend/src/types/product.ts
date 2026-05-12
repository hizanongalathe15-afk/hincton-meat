export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images: string[]
  rating: number
  reviews: number
  category: string
  inStock: boolean
  description?: string
  weight?: string
  origin?: string
  sku?: string
  subCategory?: string
  stockQuantity?: number
  featured?: boolean
  tags?: string[]
  nutritionalInfo?: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
  storageInstructions?: string
  shelfLife?: string
  isHalal?: boolean
  isOrganic?: boolean
  discount?: {
    percentage: number
    validUntil: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateProductData {
  name: string
  category: string
  subCategory: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  weight: {
    min: number
    max: number
    unit: 'kg' | 'g' | 'lbs'
  }
  inStock: boolean
  stockQuantity: number
  featured: boolean
  tags: string[]
  nutritionalInfo?: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
  storageInstructions: string
  shelfLife: string
  origin?: string
  isHalal?: boolean
  isOrganic?: boolean
  discount?: {
    percentage: number
    validUntil: string
  }
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface ProductFilters {
  category?: string
  subCategory?: string
  minPrice?: number
  maxPrice?: number
  minWeight?: number
  maxWeight?: number
  featured?: boolean
  inStock?: boolean
  search?: string
  sortBy?: 'createdAt' | 'price' | 'name'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ProductResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

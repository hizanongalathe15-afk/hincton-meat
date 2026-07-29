import { useState, useEffect } from 'react'
import { X, Upload, Trash2, Plus, Save, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

import { contentApi } from '../services/adminApi'
import { formatPrice } from '../utils/currency'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: ProductFormData) => void
  product?: any
  mode: 'add' | 'edit'
}

interface ProductFormData {
  id?: string
  name: string
  description: string
  categoryId: string
  price: number
  comparePrice?: number
  stockQuantity: number
  sku: string
  weight: number
  unit: string
  isPublished: boolean
  isFeatured: boolean
  isOnSale: boolean
  tags: string[]
  images: File[]
  videos: File[]
  existingImages?: string[]
  existingVideos?: string[]
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  mode
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    comparePrice: undefined,
    stockQuantity: 0,
    sku: '',
    weight: 500,
    unit: 'g',
    isPublished: true,
    isFeatured: false,
    isOnSale: false,
    tags: [],
    images: [],
    videos: [],
    existingImages: [],
    existingVideos: []
  })
  
  const [categories, setCategories] = useState([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      if (mode === 'edit' && product) {
        setFormData({
          id: product.id,
          name: product.name || '',
          description: product.description || '',
          categoryId: product.categoryId || '',
          price: Number(product.price) || 0,
          comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
          stockQuantity: product.stockQuantity || 0,
          sku: product.sku || '',
          weight: product.weight || 500,
          unit: product.weightUnit || product.unit || 'g',
          isPublished: product.isPublished ?? true,
          isFeatured: product.isFeatured ?? false,
          isOnSale: product.isOnSale ?? Boolean(product.comparePrice && product.price < product.comparePrice),
          tags: product.tags || [],
          images: [],
          videos: [],
          existingImages: product.productImages?.map((img: any) => img.url) || [],
          existingVideos: product.productVideos?.map((video: any) => video.url) || product.videos || []
        })
        setImagePreviews(product.productImages?.map((img: any) => img.url) || [])
      } else {
        resetForm()
      }
    }
  }, [isOpen, mode, product])

  const fetchCategories = async () => {
    try {
      const data = await contentApi.getCategories()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const createCategoryFromName = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    setLoading(true)
    try {
      const response = await contentApi.createCategory({
        name,
        slug: slugify(name),
        description: '',
        isActive: true,
      })
      const category = response.category
      setCategories((current: any[]) => [...current, category].sort((a, b) => a.name.localeCompare(b.name)) as any)
      setFormData((current) => ({ ...current, categoryId: category.id }))
      setNewCategoryName('')
    } catch (error) {
      console.error('Failed to create category:', error)
      toast.error('Could not create category')
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (category: any) => {
    if (!category?.id) return

    const confirmed = window.confirm(`Delete "${category.name}"? Products in this category will be moved to Uncategorized.`)
    if (!confirmed) return

    setLoading(true)
    try {
      await contentApi.deleteCategory(category.id)
      setCategories((current: any[]) => current.filter((item) => item.id !== category.id) as any)
      setFormData((current) => current.categoryId === category.id ? { ...current, categoryId: '' } : current)
      toast.success('Category deleted')
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error('Could not delete category')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      price: 0,
      comparePrice: undefined,
      stockQuantity: 0,
      sku: '',
      weight: 500,
      unit: 'g',
      isPublished: true,
      isFeatured: false,
      isOnSale: false,
      tags: [],
      images: [],
      videos: [],
      existingImages: [],
      existingVideos: []
    })
    setImagePreviews([])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return
    
    const newImages = Array.from(files)
    const newPreviews = newImages.map(file => URL.createObjectURL(file))
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }))
    
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const handleVideoUpload = (files: FileList | null) => {
    if (!files) return
    const newVideos = Array.from(files)
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, ...newVideos]
    }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      const imageTransfer = new DataTransfer()
      const videoTransfer = new DataTransfer()
      files.forEach((file) => {
        if (file.type.startsWith('video/')) videoTransfer.items.add(file)
        if (file.type.startsWith('image/')) imageTransfer.items.add(file)
      })
      if (imageTransfer.files.length) handleImageUpload(imageTransfer.files)
      if (videoTransfer.files.length) handleVideoUpload(videoTransfer.files)
    }
  }

  const removeImage = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      const newExistingImages = formData.existingImages?.filter((_, i) => i !== index) || []
      const newPreviews = imagePreviews.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, existingImages: newExistingImages }))
      setImagePreviews(newPreviews)
    } else {
      const existingCount = formData.existingImages?.length || 0
      const imageIndex = existingCount + index
      const newImages = formData.images.filter((_, i) => i !== index)
      const newPreviews = imagePreviews.filter((_, i) => i !== imageIndex)
      
      // Revoke object URLs to prevent memory leaks
      imagePreviews.slice(existingCount).forEach((url, i) => {
        if (i >= index) URL.revokeObjectURL(url)
      })
      
      setFormData(prev => ({ ...prev, images: newImages }))
      setImagePreviews(newPreviews)
    }
  }

  const removeVideo = (index: number, isExisting = false) => {
    if (isExisting) {
      setFormData(prev => ({ ...prev, existingVideos: prev.existingVideos?.filter((_, i) => i !== index) || [] }))
    } else {
      setFormData(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }))
    }
  }

  const generateSku = () => {
    const name = formData.name.replace(/\s+/g, '').toUpperCase().slice(0, 8)
    const categoryMatch = categories.find((cat: any) => cat.id === formData.categoryId) as any
    const categoryName = String(categoryMatch?.name || 'CAT')
    const category = categoryName.toUpperCase().slice(0, 4)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const sku = `${category}-${name}-${random}`
    setFormData(prev => ({ ...prev, sku }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSave(formData)
      onClose()
      resetForm()
    } catch (error) {
      console.error('Failed to save product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Add New Product' : 'Edit Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Auto-generated or manual"
                />
                <button
                  type="button"
                  onClick={generateSku}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter product description"
            />
          </div>

          {/* Category and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="flex gap-2">
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                  className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select category</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const category = categories.find((item: any) => item.id === formData.categoryId)
                    if (category) deleteCategory(category)
                  }}
                  disabled={!formData.categoryId || loading}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Delete selected category"
                  title="Delete selected category"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Type a new category, e.g. Utensils or Cars"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={createCategoryFromName}
                  disabled={!newCategoryName.trim() || loading}
                  className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              {categories.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Manage categories</div>
                  <div className="space-y-1">
                    {categories.map((category: any) => (
                      <div
                        key={category.id}
                        className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${
                          formData.categoryId === category.id ? 'bg-red-50 text-red-800' : 'bg-white text-gray-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setFormData((current) => ({ ...current, categoryId: category.id }))}
                          className="min-w-0 flex-1 truncate text-left"
                        >
                          {category.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCategory(category)}
                          disabled={loading}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded text-gray-400 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                          aria-label={`Delete ${category.name}`}
                          title={`Delete ${category.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (KSH) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="0.00"
              />
              {formData.price > 0 && (
                <p className="text-sm text-gray-600 mt-1">{formatPrice(formData.price)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Before Price / Compare Price (KSH)
              </label>
              <input
                type="number"
                name="comparePrice"
                value={formData.comparePrice || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Optional crossed-out price"
              />
              {formData.comparePrice && (
                <p className="text-sm text-gray-600 mt-1">{formatPrice(formData.comparePrice)}</p>
              )}
            </div>
          </div>

          {/* Stock and Weight */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight *
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                required
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="lbs">Pounds (lbs)</option>
                <option value="pcs">Pieces (pcs)</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Published</span>
              </label>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Featured</span>
              </label>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isOnSale"
                  checked={formData.isOnSale}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">On Sale / Hot Deal</span>
              </label>
            </div>
          </div>

          {/* Discount Hint */}
          {formData.comparePrice && formData.price > 0 && formData.comparePrice > formData.price && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <Tag className="h-5 w-5 text-red-600" />
              <div className="text-sm">
                <span className="font-semibold text-red-700">
                  -{Math.round(((formData.comparePrice - formData.price) / formData.comparePrice) * 100)}%
                </span>
                <span className="text-red-700/80 ml-2">
                  discount. Save {formatPrice(formData.comparePrice - formData.price)}.
                </span>
                {!formData.isOnSale && (
                  <span className="text-red-700/70 ml-2">
                    Tip: toggle <span className="font-semibold">On Sale</span> above to feature it in the deals banner.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            
            {/* Image Preview Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index, index < (formData.existingImages?.length || 0))}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop images or videos here, or click to select images
              </p>
              <p className="text-sm text-gray-500 mb-4">
                PNG, JPG, GIF, WebP images, plus video files from drop
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Images
              </label>
            </div>
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Videos
            </label>
            {(formData.existingVideos?.length || formData.videos.length) > 0 && (
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {formData.existingVideos?.map((url, index) => (
                  <div key={url} className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <video src={url} controls className="h-36 w-full object-cover" />
                    <button type="button" onClick={() => removeVideo(index, true)} className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {formData.videos.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    <button type="button" onClick={() => removeVideo(index)} className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
              <p className="mb-2 text-gray-600">Upload one or more product videos</p>
              <p className="mb-4 text-sm text-gray-500">MP4, WebM, MOV up to 50MB each</p>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={(e) => handleVideoUpload(e.target.files)}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="inline-flex cursor-pointer items-center rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800">
                <Plus className="mr-2 h-4 w-4" />
                Add Videos
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {mode === 'add' ? 'Add Product' : 'Update Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductModal

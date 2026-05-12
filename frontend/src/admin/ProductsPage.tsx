import { useState, useEffect } from 'react'
import { RefreshCw, Plus } from 'lucide-react'
import ProductTable from './ProductTable'
import ProductModal from './ProductModal'
import { productsApi } from '../services/adminApi'
import toast from 'react-hot-toast'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'

interface ProductsPageProps {
  onEditProduct?: (product: any) => void
  onDeleteProduct?: (productId: string) => void
  onViewProduct?: (product: any) => void
  onAddNewProduct?: () => void
  onShareProduct?: (product: any) => void
  onDownloadProduct?: (product: any) => void
  onBulkUpload?: () => void
  onBulkExport?: () => void
}

type ProductStatus = 'active' | 'inactive' | 'out_of_stock'

type Product = {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  stock: number
  status: ProductStatus
  image: string
  sku: string
  createdAt: string
  sales: number
  raw?: any
}

const ProductsPage = ({
  onEditProduct,
  onDeleteProduct,
  onViewProduct,
  onAddNewProduct,
  onShareProduct,
  onDownloadProduct,
  onBulkUpload,
  onBulkExport
}: ProductsPageProps) => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true)
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()

  const fetchProducts = async () => {
      try {
        const data = await productsApi.getProducts()
        
        // Transform API data to component format
        const transformedProducts = (data.products || []).map((product: any) => {
          const stockQuantity = product.stockQuantity || 0
          let status: ProductStatus = 'active'
          if (!product.isPublished) status = 'inactive'
          else if (stockQuantity === 0) status = 'out_of_stock'
          
          return {
            id: product.id,
            name: product.name,
            category: product.category?.name || 'Uncategorized',
            price: Number(product.price) || 0,
            originalPrice: product.comparePrice ? Number(product.comparePrice) : undefined,
            stock: stockQuantity,
            status,
            image: product.productImages?.[0]?.url || 'https://via.placeholder.com/120x120',
            sku: product.sku || '',
            createdAt: product.createdAt,
            sales: product._count?.orderItems || 0,
            raw: product,
          }
        })
        
        setProducts(transformedProducts)
        setLastUpdated(new Date())
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    fetchProducts()
    
    // Auto-refresh every 30 seconds
    const intervalId = isAutoRefreshing ? setInterval(fetchProducts, 30000) : undefined
    
    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProducts()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAutoRefreshing])

  const handleEdit = (product: any) => {
    setSelectedProduct(product.raw || product)
    setModalMode('edit')
    setIsModalOpen(true)
    onEditProduct?.(product)
  }

  const handleDelete = async (productId: string) => {
    const product = products.find(p => p.id === productId)
    const confirmed = await confirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product?.name}"? This will remove it from the customer storefront and cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete'
    })

    if (!confirmed) return

    try {
      await productsApi.deleteProduct(productId)
      setProducts(products.filter(p => p.id !== productId))
      toast.success('Product deleted successfully')
      onDeleteProduct?.(productId)
    } catch (error: any) {
      console.error('Failed to delete product:', error)
      toast.error(error.message || 'Failed to delete product')
    }
  }

  const handleView = (product: any) => {
    console.log('View product:', product)
    onViewProduct?.(product)
  }

  const handleRestock = async (product: any) => {
    const amountText = window.prompt(`Enter restock quantity for ${product.name}:`, String(product.stock || 0))
    if (!amountText) return

    const quantity = parseInt(amountText, 10)
    if (Number.isNaN(quantity) || quantity < 0) {
      toast.error('Please enter a valid non-negative number')
      return
    }

    try {
      const formData = new FormData()
      formData.append('stockQuantity', String(quantity))
      await productsApi.updateProduct(product.id, formData)

      setProducts((current) => current.map((item) =>
        item.id === product.id ? { ...item, stock: quantity, status: quantity === 0 ? 'out_of_stock' : 'active' } : item
      ))

      toast.success(`Restocked ${product.name} to ${quantity} units`)
    } catch (error: any) {
      console.error('Failed to restock product:', error)
      toast.error(error.message || 'Failed to restock product')
    }
  }

  const handleAddNew = () => {
    setSelectedProduct(null)
    setModalMode('add')
    setIsModalOpen(true)
    onAddNewProduct?.()
  }

  const handleSaveProduct = async (product: any) => {
    const formData = new FormData()
    formData.append('name', product.name)
    formData.append('description', product.description || '')
    formData.append('categoryId', product.categoryId || '')
    formData.append('price', String(product.price))
    if (product.comparePrice) formData.append('comparePrice', String(product.comparePrice))
    formData.append('stockQuantity', String(product.stockQuantity))
    formData.append('sku', product.sku || '')
    formData.append('weight', String(product.weight || 0))
    formData.append('unit', product.unit || 'kg')
    formData.append('isPublished', String(product.isPublished))
    formData.append('existingImages', JSON.stringify(product.existingImages || []))
    product.images.forEach((image: File) => formData.append('images', image))

    if (modalMode === 'edit' && product.id) {
      await productsApi.updateProduct(product.id, formData)
      toast.success('Product updated successfully')
    } else {
      await productsApi.createProduct(formData)
      toast.success('Product created successfully')
    }

    await fetchProducts()
  }

  const handleShare = (product: any) => {
    console.log('Share product:', product)
    
    // Generate shareable link
    const productUrl = `${window.location.origin}/product/${product.id}`
    
    // Copy to clipboard
    navigator.clipboard.writeText(productUrl).then(() => {
      alert('Product link copied to clipboard!')
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = productUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Product link copied to clipboard!')
    })
    
    onShareProduct?.(product)
  }

  const handleDownload = (product: any) => {
    console.log('Download product:', product)
    
    // Create product data for download
    const productData = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      status: product.status,
      sku: product.sku,
      sales: product.sales,
      createdAt: product.createdAt
    }
    
    // Convert to JSON and download
    const dataStr = JSON.stringify(productData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `product-${product.id}-${product.name.replace(/\s+/g, '-').toLowerCase()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    onDownloadProduct?.(product)
  }

  const handleBulkUpload = () => {
    console.log('Bulk upload products')
    
    // Create file input for bulk upload
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.csv'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            let products
            
            if (file.name.endsWith('.json')) {
              products = JSON.parse(content)
            } else if (file.name.endsWith('.csv')) {
              // Simple CSV parsing (you might want to use a proper CSV library)
              const lines = content.split('\n')
              const headers = lines[0].split(',')
              products = lines.slice(1).map(line => {
                const values = line.split(',')
                const product: any = {}
                headers.forEach((header, index) => {
                  product[header.trim()] = values[index]?.trim()
                })
                return product
              })
            }
            
            console.log('Bulk upload products:', products)
            alert(`Successfully parsed ${products?.length || 0} products for upload`)
            // Here you would normally call an API to upload the products
          } catch (error) {
            alert('Error parsing file. Please check the format.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
    
    onBulkUpload?.()
  }

  const handleBulkExport = () => {
    console.log('Bulk export products')

    // Call the bulk export API
    const link = document.createElement('a')
    link.href = '/api/admin/products/bulk-export'
    link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    onBulkExport?.()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Calculate product statistics
  const activeProducts = products.filter(p => p.status === 'active').length
  const outOfStock = products.filter(p => p.status === 'out_of_stock').length
  const inactiveProducts = products.filter(p => p.status === 'inactive').length
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0)

  return (
    <div className="space-y-6 p-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-1">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchProducts}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              setSelectedProduct(null)
              setModalMode('add')
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
          <button
            onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isAutoRefreshing
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isAutoRefreshing ? 'Auto-Sync ON' : 'Auto-Sync OFF'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                <path d="m7.5 4.27 9 5.15"></path>
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                <path d="m3.3 7 8.7 5 8.7-5"></path>
                <path d="M12 22V12"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
              <p className="text-xs text-green-600 mt-1">{Math.round((activeProducts/products.length)*100)}% of total</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
              <p className="text-xs text-gray-600 mt-1">units sold</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{outOfStock}</p>
              <p className="text-xs text-red-600 mt-1">{inactiveProducts} inactive</p>
            </div>
            <div className="bg-red-500 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <ProductTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onRestock={handleRestock}
          onAddNew={handleAddNew}
          onShare={handleShare}
          onDownload={handleDownload}
          onBulkUpload={handleBulkUpload}
          onBulkExport={handleBulkExport}
        />
      <ProductModal
        isOpen={isModalOpen}
        mode={modalMode}
        product={selectedProduct}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
      />

      <ConfirmationDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options?.title || ''}
        message={options?.message || ''}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        type={options?.type}
        icon={options?.icon}
      />
    </div>
  )
}

export default ProductsPage

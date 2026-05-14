import { useState } from 'react'
import {
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  Package,
  AlertCircle,
  Share2,
  Download,
  Upload,
  Grid3X3,
  List
} from 'lucide-react'
import { formatPrice } from '../utils/currency'

interface Product {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  stock: number
  status: 'active' | 'inactive' | 'out_of_stock'
  image: string
  sku: string
  createdAt: string
  sales: number
}

interface ProductTableProps {
  products?: Product[]
  onEdit?: (product: Product) => void
  onDelete?: (productId: string) => void
  onView?: (product: Product) => void
  onRestock?: (product: Product) => void
  onAddNew?: () => void
  onShare?: (product: Product) => void
  onDownload?: (product: Product) => void
  onBulkUpload?: () => void
  onBulkExport?: () => void
  loading?: boolean
}

const ProductTable = ({ 
  products, 
  onEdit, 
  onDelete, 
  onView, 
  onRestock,
  onAddNew,
  onShare,
  onDownload,
  onBulkUpload,
  onBulkExport,
  loading = false 
}: ProductTableProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<Product['status'] | ''>('')
  const [sortField, setSortField] = useState<keyof Product>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const productsData = products || []

  const categories = Array.from(new Set(productsData.map(p => p.category))).sort((a, b) => a.localeCompare(b))
  const statuses = ['active', 'inactive', 'out_of_stock']

  const filteredProducts = productsData
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(product => !selectedCategory || product.category === selectedCategory)
    .filter(product => !selectedStatus || product.status === selectedStatus)
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      let result = 0
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        result = aValue - bValue
      } else {
        result = String(aValue || '').localeCompare(String(bValue || ''), undefined, { numeric: true, sensitivity: 'base' })
      }

      return sortDirection === 'asc' ? result : -result
    })

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 font-medium'
    if (stock < 10) return 'text-yellow-600 font-medium'
    return 'text-gray-900'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Products</h2>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onBulkUpload}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Bulk Upload
            </button>
            <button
              onClick={onBulkExport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as Product['status'] | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </option>
            ))}
          </select>

          <select
            value={`${sortField}:${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split(':') as [keyof Product, 'asc' | 'desc']
              setSortField(field)
              setSortDirection(direction)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            aria-label="Sort products"
          >
            <option value="name:asc">A-Z</option>
            <option value="name:desc">Z-A</option>
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="price:asc">Price low to high</option>
            <option value="price:desc">Price high to low</option>
            <option value="stock:asc">Stock low to high</option>
            <option value="stock:desc">Stock high to low</option>
          </select>

          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md p-2 ${viewMode === 'table' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Table view"
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-2 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Grid view"
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="aspect-[4/3] bg-gray-100">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="line-clamp-2 text-base font-bold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku || 'Not set'}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                    {product.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{product.category}</span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-900">{formatPrice(product.price)}</span>
                  <span className={`rounded-full bg-gray-100 px-2.5 py-1 ${getStockColor(product.stock)}`}>{product.stock} units</span>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                  <button onClick={() => onView?.(product)} className="p-2 text-gray-600 hover:text-gray-900" title="View Product"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => onRestock?.(product)} className="p-2 text-green-600 hover:text-green-900" title="Restock Product"><Package className="w-4 h-4" /></button>
                  <button onClick={() => onShare?.(product)} className="p-2 text-green-600 hover:text-green-900" title="Share Product"><Share2 className="w-4 h-4" /></button>
                  <button onClick={() => onDownload?.(product)} className="p-2 text-purple-600 hover:text-purple-900" title="Download Product"><Download className="w-4 h-4" /></button>
                  <button onClick={() => onEdit?.(product)} className="p-2 text-blue-600 hover:text-blue-900" title="Edit Product"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => onDelete?.(product.id)} className="p-2 text-red-600 hover:text-red-900" title="Delete Product"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Product
                  <ChevronDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Category
                  <ChevronDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('price')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Price
                  <ChevronDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('stock')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Stock
                  <ChevronDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('sales')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Sales
                  <ChevronDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatPrice(product.price)}
                  </div>
                  {product.originalPrice && (
                    <div className="text-sm text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${getStockColor(product.stock)}`}>
                    {product.stock} units
                  </div>
                  {product.stock < 10 && product.stock > 0 && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <AlertCircle className="w-3 h-3" />
                      Low stock
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.sales}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.status)}`}>
                    {product.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView?.(product)}
                      className="text-gray-600 hover:text-gray-900"
                      title="View Product"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRestock?.(product)}
                      className="text-green-600 hover:text-green-900"
                      title="Restock Product"
                    >
                      <Package className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onShare?.(product)}
                      className="text-green-600 hover:text-green-900"
                      title="Share Product"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDownload?.(product)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Download Product"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit?.(product)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Product"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(product.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory || selectedStatus 
              ? 'Try adjusting your filters' 
              : 'Get started by adding your first product'}
          </p>
          {!searchTerm && !selectedCategory && !selectedStatus && (
            <button
              onClick={onAddNew}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Add Product
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductTable

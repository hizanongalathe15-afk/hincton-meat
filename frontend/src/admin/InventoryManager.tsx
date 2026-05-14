import { useState, useEffect } from 'react'
import { 
  Search,
  Plus,
  Edit, 
  Trash2, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,

  BarChart3,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import { formatPrice } from '../utils/currency'

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  reorderPoint: number
  unitPrice: number
  totalValue: number
  supplier: string
  lastRestocked: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock'
  trend: 'up' | 'down' | 'stable'
  monthlySales: number
  turnoverRate: number
}

interface InventoryManagerProps {
  inventory?: InventoryItem[]
  onEdit?: (item: InventoryItem) => void
  onDelete?: (itemId: string) => void
  onRestock?: (itemId: string, quantity: number) => void
  onAddNew?: () => void
  loading?: boolean
}

const InventoryManager = ({ 
  inventory, 
  onEdit, 
  onDelete, 
  onRestock, 
  onAddNew,
  loading = false 
}: InventoryManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [sortField, setSortField] = useState<keyof InventoryItem>('currentStock')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const defaultInventory: InventoryItem[] = [
    {
      id: '1',
      name: 'Premium Wagyu Steak',
      sku: 'BEEF-001',
      category: 'Beef',
      currentStock: 12,
      minStock: 10,
      maxStock: 50,
      reorderPoint: 15,
      unitPrice: 125.00,
      totalValue: 1500.00,
      supplier: 'Hincton Meat Products',
      lastRestocked: '2024-01-10',
      status: 'in_stock',
      trend: 'up',
      monthlySales: 45,
      turnoverRate: 3.8
    },
    {
      id: '2',
      name: 'Grass-Fed Beef Ribeye',
      sku: 'BEEF-002',
      category: 'Beef',
      currentStock: 8,
      minStock: 10,
      maxStock: 40,
      reorderPoint: 12,
      unitPrice: 89.50,
      totalValue: 716.00,
      supplier: 'Organic Farms Ltd.',
      lastRestocked: '2024-01-08',
      status: 'low_stock',
      trend: 'stable',
      monthlySales: 38,
      turnoverRate: 4.2
    },
    {
      id: '3',
      name: 'Organic Chicken Breast',
      sku: 'CHICK-001',
      category: 'Chicken',
      currentStock: 0,
      minStock: 15,
      maxStock: 60,
      reorderPoint: 20,
      unitPrice: 45.00,
      totalValue: 0,
      supplier: 'Free Range Farms',
      lastRestocked: '2024-01-05',
      status: 'out_of_stock',
      trend: 'down',
      monthlySales: 32,
      turnoverRate: 5.1
    },
    {
      id: '4',
      name: 'Wild Salmon Fillet',
      sku: 'FISH-001',
      category: 'Seafood',
      currentStock: 25,
      minStock: 10,
      maxStock: 30,
      reorderPoint: 12,
      unitPrice: 65.00,
      totalValue: 1625.00,
      supplier: 'Ocean Fresh Co.',
      lastRestocked: '2024-01-12',
      status: 'overstock',
      trend: 'up',
      monthlySales: 28,
      turnoverRate: 2.8
    },
    {
      id: '5',
      name: 'Herb-Crusted Lamb',
      sku: 'LAMB-001',
      category: 'Lamb',
      currentStock: 6,
      minStock: 8,
      maxStock: 25,
      reorderPoint: 10,
      unitPrice: 95.00,
      totalValue: 570.00,
      supplier: 'Mountain Ranch',
      lastRestocked: '2024-01-09',
      status: 'low_stock',
      trend: 'stable',
      monthlySales: 22,
      turnoverRate: 3.2
    }
  ]

  const [inventoryData, setInventoryData] = useState<InventoryItem[]>(inventory && inventory.length > 0 ? inventory : defaultInventory)

  useEffect(() => {
    if (inventory && inventory.length > 0) {
      setInventoryData(inventory)
    }
  }, [inventory])

  const categories = Array.from(new Set(inventoryData.map(item => item.category)))
  const statuses = ['in_stock', 'low_stock', 'out_of_stock', 'overstock']

  const filteredInventory = inventoryData
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(item => !selectedCategory || item.category === selectedCategory)
    .filter(item => !selectedStatus || item.status === selectedStatus)
    .filter(item => !showLowStockOnly || item.status === 'low_stock' || item.status === 'out_of_stock')
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      case 'overstock': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockHealthColor = (current: number, min: number, max: number) => {
    if (current === 0) return 'text-red-600 font-bold'
    if (current < min) return 'text-yellow-600 font-semibold'
    if (current > max) return 'text-blue-600 font-semibold'
    return 'text-green-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  const handleLocalDelete = (itemId: string) => {
    setInventoryData((prev) => prev.filter(item => item.id !== itemId))
    onDelete?.(itemId)
  }

  const handleLocalRestock = (item: InventoryItem) => {
    const quantity = item.reorderPoint
    setInventoryData((prev) => prev.map((current) => {
      if (current.id !== item.id) return current

      const updatedStatus = quantity === 0
        ? 'out_of_stock'
        : quantity < current.minStock
          ? 'low_stock'
          : 'in_stock'

      return {
        ...current,
        currentStock: quantity,
        status: updatedStatus,
        totalValue: Number((quantity * current.unitPrice).toFixed(2)),
      }
    }))
    onRestock?.(item.id, quantity)
  }

  const handleLocalEdit = (item: InventoryItem) => {
    const updatedName = window.prompt('Edit product name', item.name)
    if (updatedName === null) return

    setInventoryData((prev) => prev.map((current) =>
      current.id === item.id ? { ...current, name: updatedName } : current
    ))
    onEdit?.({ ...item, name: updatedName })
  }

  const totalInventoryValue = inventoryData.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = inventoryData.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').length
  const outOfStockItems = inventoryData.filter(item => item.status === 'out_of_stock').length
  const overstockItems = inventoryData.filter(item => item.status === 'overstock').length

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting inventory data...')
  }

  const handleImport = () => {
    // Import functionality would be implemented here
    console.log('Importing inventory data...')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading inventory...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Inventory Management</h2>
            <p className="text-gray-600">Track and manage your product inventory</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onAddNew}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{inventoryData.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(totalInventoryValue)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-600">Low Stock</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Overstock</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{overstockItems}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
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
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500"
            />
            <span className="text-sm">Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('currentStock')}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    Stock Level
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min/Max
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('unitPrice')}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    Unit Price
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('totalValue')}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    Total Value
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
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
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {item.sku} • {item.category}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-lg font-medium ${getStockHealthColor(item.currentStock, item.minStock, item.maxStock)}`}>
                      {item.currentStock}
                    </div>
                    <div className="text-sm text-gray-500">
                      Reorder at: {item.reorderPoint}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.minStock} - {item.maxStock}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(item.unitPrice)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(item.totalValue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(item.trend)}
                      <span className="text-sm text-gray-600">{item.monthlySales}/mo</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {(item.status === 'low_stock' || item.status === 'out_of_stock') && (
                        <button
                          onClick={() => handleLocalRestock(item)}
                          className="text-green-600 hover:text-green-900"
                          title="Restock"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleLocalEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleLocalDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
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

        {/* Empty State */}
        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory || selectedStatus || showLowStockOnly
                ? 'Try adjusting your filters' 
                : 'Get started by adding your first inventory item'}
            </p>
            {!searchTerm && !selectedCategory && !selectedStatus && !showLowStockOnly && (
              <button
                onClick={onAddNew}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Add Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inventory Alerts */}
      {(lowStockItems > 0 || outOfStockItems > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Alerts</h3>
          <div className="space-y-3">
            {outOfStockItems > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">{outOfStockItems} items out of stock</p>
                  <p className="text-sm text-red-700">Immediate restocking required</p>
                </div>
              </div>
            )}
            {lowStockItems > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">{lowStockItems} items low on stock</p>
                  <p className="text-sm text-yellow-700">Consider restocking soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryManager

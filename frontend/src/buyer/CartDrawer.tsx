import { useState } from 'react'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  Trash2, 
  Heart,
  ArrowRight
} from 'lucide-react'
import { formatCurrency } from '../utils/helpers'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { CartItem } from '../types'
import { useLanguage } from '../contexts/LanguageContext'
interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onCheckout: () => void
  onToggleWishlist?: (itemId: string) => void
  wishlistItems?: Set<string>
}

const CartDrawer = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onToggleWishlist,
  wishlistItems = new Set()
}: CartDrawerProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const { isOpen: isDialogOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()
  const { t } = useLanguage()

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = subtotal > 5000 ? 0 : 500
  const tax = subtotal * 0.16 // 16% VAT in Kenya
  const total = subtotal + shipping + tax

  const handleRemoveItem = async (itemId: string) => {
    const item = items.find(item => item.id === itemId)
    const confirmed = await confirm({
      title: t('cart.removeItem'),
      message: t('cart.removeConfirm').replace('{itemName}', item?.name || ''),
      confirmText: t('cart.remove'),
      cancelText: t('cart.keep'),
      type: 'warning',
      icon: 'remove'
    })

    if (confirmed) {
      onRemoveItem(itemId)
    }
  }

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    try {
      await onCheckout()
      onClose()
    } finally {
      setIsCheckingOut(false)
    }
  }

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      onUpdateQuantity(itemId, newQuantity)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold">
              {t('cart.shoppingCart')} ({items.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('cart.cartEmpty')}</h3>
              <p className="text-gray-600 mb-6">{t('cart.cartEmptyDescription')}</p>
              <button
                onClick={onClose}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('cart.continueShopping')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                      {item.weight && (
                        <p className="text-sm text-gray-600 mb-2">{item.weight}</p>
                      )}
                      {item.category && (
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                      {onToggleWishlist && (
                        <button
                          onClick={() => onToggleWishlist(item.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Heart 
                            className={`w-4 h-4 ${
                              wishlistItems.has(item.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-gray-500'
                            }`} 
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Price and Quantity */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{t('cart.quantity')}:</span>
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price)} {t('cart.each')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('cart.subtotal')}</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('cart.shipping')}</span>
                <span className="font-medium">
                  {shipping === 0 ? t('cart.free') : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('cart.tax')}</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">{t('cart.total')}</span>
                  <span className="font-bold text-lg text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Notice */}
            {shipping > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  {t('cart.freeShippingNotice').replace('{amount}', formatCurrency(5000 - subtotal))}
                </p>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {isCheckingOut ? t('cart.processing') : t('cart.proceedToCheckout')}
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Continue Shopping */}
            <button
              onClick={onClose}
              className="w-full text-center text-gray-600 hover:text-gray-900 py-2 transition-colors"
            >
              {t('cart.continueShopping')}
            </button>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options?.title || ''}
        message={options?.message || ''}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        type={options?.type}
        icon={options?.icon}
      />
    </>
  )
}

export default CartDrawer

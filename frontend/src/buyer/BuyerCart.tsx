import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Product } from '../types'
import { formatPrice } from '../utils/currency'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { useLanguage } from '../contexts/LanguageContext'

interface CartItem extends Product {
  quantity: number
}

interface BuyerCartProps {
  items: CartItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onToggleWishlist?: (itemId: string) => void
  wishlistItems?: Set<string>
  reminder?: {
    type: string
    message: string
    productIds?: string[]
  } | null
}

const BuyerCart = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onToggleWishlist,
  wishlistItems = new Set(),
  reminder = null
}: BuyerCartProps) => {
  const navigate = useNavigate()
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()
  const { t } = useLanguage()

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleRemoveItem = async (itemId: string) => {
    const item = items.find(item => item.id === itemId)
    const confirmed = await confirm({
      title: t('cart.removeItem'),
      message: t('cart.removeConfirm').replace('{itemName}', item?.name || ''),
      confirmText: t('common.remove'),
      cancelText: t('common.keep'),
      type: 'warning',
      icon: 'remove'
    })

    if (confirmed) {
      onRemoveItem(itemId)
    }
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gray-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-wide text-red-400">{t('cart.yourBasket')}</p>
            <h1 className="mt-3 text-4xl font-extrabold">{t('cart.title')}</h1>
            <p className="mt-3 text-gray-300">{items.length} {items.length === 1 ? t('cart.item') : t('cart.items')} {t('cart.readyForCheckout')}</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <ShoppingBag className="mx-auto h-12 w-12 text-red-600" />
              <h2 className="mt-4 text-2xl font-bold text-gray-950">{t('cart.empty')}</h2>
              <p className="mt-2 text-gray-600">{t('cart.emptyMessage')}</p>
              <Link to="/shop" className="mt-6 inline-flex rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700">
                {t('cart.shopProducts')}
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {reminder && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {reminder.message}
                  </div>
                )}
                {items.map((item) => (
                  <div key={item.id} className="grid gap-4 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto] sm:items-center">
                    <img src={item.image} alt={item.name} className="h-28 w-full rounded-lg object-cover sm:w-28" />
                    <div>
                      <p className="text-sm font-bold uppercase text-red-700">{item.category}</p>
                      <h2 className="mt-1 text-xl font-bold text-gray-950">{item.name}</h2>
                      <p className="mt-1 text-sm text-gray-600">{item.weight} {item.origin ? `- ${item.origin}` : ''}</p>
                      <button
                        type="button"
                        onClick={() => onToggleWishlist?.(item.id)}
                        className="mt-3 text-sm font-semibold text-gray-600 transition hover:text-red-600"
                      >
                        {wishlistItems.has(item.id) ? t('cart.savedToWishlist') : t('cart.saveForLater')}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <p className="text-xl font-extrabold text-gray-950">{formatPrice(item.price * item.quantity)}</p>
                      <div className="flex items-center rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-2 text-gray-600 hover:text-red-600"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 px-2 text-center font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-2 text-gray-600 hover:text-red-600"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('common.remove')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="h-fit rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-950">{t('cart.orderSummary')}</h2>
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('cart.subtotal')}</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-extrabold text-gray-950">
                      <span>{t('cart.total')}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="mt-6 w-full rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700"
                >
                  {t('cart.checkout')}
                </button>
                <Link to="/shop" className="mt-3 block text-center text-sm font-semibold text-gray-600 transition hover:text-red-600">
                  {t('cart.continueShopping')}
                </Link>
              </aside>
            </div>
          )}
        </section>
      </div>

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
    </>
  )
}

export default BuyerCart

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCurrency } from '../../utils/currencyAndSeo'

const CurrencySwitcher: React.FC = () => {
  const { currencies, active, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const handleSelect = (code: string) => {
    try {
      setCurrency(code)
      const picked = currencies.find(c => c.code === code)
      if (picked) {
        toast.success(`Currency switched to ${picked.label}`)
      }
    } catch (error) {
      toast.error('Could not update currency')
    } finally {
      setOpen(false)
    }
  }

  if (!currencies.length) return null

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select currency"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="font-semibold text-gray-900">{active.symbol}</span>
        <span className="hidden sm:inline text-gray-600">{active.code}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 py-1"
        >
          {currencies.map((currency) => {
            const isActive = currency.code === active.code
            return (
              <li key={currency.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(currency.code)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive ? 'bg-red-50 text-red-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                      isActive ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {currency.symbol}
                    </span>
                    <div className="min-w-0 text-left">
                      <div className="font-semibold truncate">{currency.label}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {currency.code} · 1 {currency.code} ≈ {(1 / Math.max(currency.rate, 0.0001)).toFixed(4)} base
                      </div>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-red-700 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default CurrencySwitcher

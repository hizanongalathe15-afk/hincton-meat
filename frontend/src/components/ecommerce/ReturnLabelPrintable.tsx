import React, { useEffect, useState } from 'react'
import { Printer, Package, MapPin, Loader2, Truck, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import { featuresApi } from '../../services/featuresApi'
import { useSiteContent } from '../../contexts/SiteContentContext'

type ReturnLabelPrintableProps = {
  returnRequestId: string
}

type ReturnLabelData = {
  returnRequestId: string
  trackingNumber?: string
  courier?: string
  returnAddress?: {
    companyName?: string
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    phone?: string
  }
  customerAddress?: {
    name?: string
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  qrData?: string
  orderId?: string
  items?: Array<{ name: string; sku?: string; quantity: number }>
  printedAt?: string
  notes?: string
}

const DEFAULT_LABEL: ReturnLabelData = {
  returnRequestId: '',
  trackingNumber: 'TRK-PENDING',
  courier: 'Hincton Returns',
  returnAddress: {
    companyName: 'Hincton Meat Products',
    street: 'Returns Department, Industrial Area',
    city: 'Nairobi',
    state: 'Nairobi County',
    zipCode: '00100',
    country: 'Kenya',
    phone: '+254 797 416181',
  },
  customerAddress: {
    name: 'Valued Customer',
    street: 'Customer address pending',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  qrData: '',
  orderId: '',
  items: [],
  printedAt: new Date().toISOString(),
  notes: 'Please ensure the package is sealed. Include the original invoice inside.',
}

const ReturnLabelPrintable: React.FC<ReturnLabelPrintableProps> = ({ returnRequestId }) => {
  const { profile } = useSiteContent()
  const [label, setLabel] = useState<ReturnLabelData>({
    ...DEFAULT_LABEL,
    returnRequestId,
    qrData: `hincton:return:${returnRequestId}`,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadLabel = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await featuresApi.generateReturnLabel(returnRequestId)
        if (cancelled) return
        const merged: ReturnLabelData = {
          ...DEFAULT_LABEL,
          returnRequestId,
          trackingNumber: data?.trackingNumber || data?.trackingCode || `RTN-${returnRequestId.slice(0, 10).toUpperCase()}`,
          courier: data?.courier || data?.carrier || DEFAULT_LABEL.courier,
          qrData: data?.qrPayload || data?.qrData || `hincton:return:${returnRequestId}`,
          orderId: data?.orderId || data?.orderReference || '',
          returnAddress: {
            ...(DEFAULT_LABEL.returnAddress || {}),
            ...(data?.returnAddress || data?.warehouseAddress || {}),
            companyName: (data?.returnAddress?.companyName || data?.warehouseAddress?.companyName) ?? profile.brand.name ?? DEFAULT_LABEL.returnAddress?.companyName,
          },
          customerAddress: {
            ...(DEFAULT_LABEL.customerAddress || {}),
            ...(data?.customerAddress || {}),
          },
          items: Array.isArray(data?.items) ? data.items : DEFAULT_LABEL.items,
          printedAt: new Date().toISOString(),
        }
        setLabel(merged)
      } catch (err) {
        if (cancelled) return
        setError('Label details are using a fallback layout because the service was unavailable.')
        toast.error('Could not fetch the latest return label data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadLabel()

    return () => {
      cancelled = true
    }
  }, [returnRequestId, profile.brand.name])

  const handlePrint = () => {
    try {
      window.print()
    } catch (err) {
      toast.error('Unable to open print dialog')
    }
  }

  const qrPayload = label.qrData || `hincton:return:${returnRequestId}`
  const qrSize = 10
  const qrMatrix = Array.from({ length: qrSize * qrSize }, (_, i) => {
    const seed = (qrPayload.charCodeAt(i % qrPayload.length) + i * 7) % 5
    return seed < 2
  })

  return (
    <div className="w-full">
      <div className="print:hidden flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Return Label</h2>
          <p className="text-sm text-gray-500">Request #{returnRequestId.slice(0, 10)}</p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Label
        </button>
      </div>

      {error && !loading && (
        <div className="print:hidden mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white border border-gray-200 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-red-700" />
        </div>
      ) : (
        <div className="print:shadow-none shadow-xl bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-950 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-7 h-7 text-red-400" />
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-gray-400">Return Shipment</div>
                <div className="text-lg font-bold">{profile.brand.name || 'Hincton Meat Products'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Courier</div>
              <div className="font-semibold">{label.courier}</div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2 space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Return To</div>
                  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                    <div className="font-bold text-gray-900 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-700 mt-0.5" />
                      <span>{label.returnAddress?.companyName}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700 pl-6 space-y-0.5">
                      {label.returnAddress?.street && <div>{label.returnAddress.street}</div>}
                      <div>
                        {[label.returnAddress?.city, label.returnAddress?.state, label.returnAddress?.zipCode]
                          .filter(Boolean).join(', ')}
                      </div>
                      {label.returnAddress?.country && <div>{label.returnAddress.country}</div>}
                      {label.returnAddress?.phone && <div className="text-gray-500">{label.returnAddress.phone}</div>}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">From</div>
                  <div className="rounded-lg border border-dashed border-gray-300 p-4">
                    <div className="font-semibold text-gray-900">{label.customerAddress?.name}</div>
                    <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                      {label.customerAddress?.street && <div>{label.customerAddress.street}</div>}
                      <div>
                        {[label.customerAddress?.city, label.customerAddress?.state, label.customerAddress?.zipCode]
                          .filter(Boolean).join(', ')}
                      </div>
                      {label.customerAddress?.country && <div>{label.customerAddress.country}</div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <div
                    className="grid gap-[1px] bg-gray-100 p-2"
                    style={{ gridTemplateColumns: `repeat(${qrSize}, 1fr)` }}
                  >
                    {qrMatrix.map((filled, idx) => (
                      <div
                        key={idx}
                        className={`w-3 h-3 md:w-3.5 md:h-3.5 ${filled ? 'bg-gray-900' : 'bg-white'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="w-full text-center">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">QR Data</div>
                  <div className="font-mono text-[10px] text-gray-700 break-all mt-0.5 px-1">{qrPayload}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Request ID</div>
                <div className="font-mono text-sm font-semibold text-gray-900 break-all">
                  {label.returnRequestId}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Tracking</div>
                <div className="font-mono text-sm font-semibold text-gray-900 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-red-700" />
                  {label.trackingNumber}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Order</div>
                <div className="font-mono text-sm font-semibold text-gray-900">
                  {label.orderId || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Printed</div>
                <div className="text-sm font-semibold text-gray-900">
                  {label.printedAt ? new Date(label.printedAt).toLocaleString() : '—'}
                </div>
              </div>
            </div>

            {Array.isArray(label.items) && label.items.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Returning Items</div>
                <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                  {label.items.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between px-4 py-2 text-sm bg-white">
                      <div>
                        <div className="font-medium text-gray-800">{item.name}</div>
                        {item.sku && <div className="text-xs text-gray-500 font-mono">{item.sku}</div>}
                      </div>
                      <div className="text-gray-700 font-semibold">x{item.quantity}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <Hash className="w-10 h-8 text-gray-800" strokeWidth={1.2} />
              <div className="flex-1 h-8 flex items-end gap-[2px] overflow-hidden">
                {Array.from({ length: 52 }, (_, i) => {
                  const width = (i % 7 === 0) ? 3 : (i % 3 === 0 ? 2 : 1)
                  const height = 40 + ((i * 37) % 60)
                  return (
                    <div
                      key={i}
                      className="bg-gray-900"
                      style={{ width: `${width}px`, height: `${height}%` }}
                    />
                  )
                })}
              </div>
              <div className="font-mono text-xs text-gray-600 tracking-widest">
                {label.trackingNumber}
              </div>
            </div>

            {label.notes && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-xs text-yellow-900">
                <strong className="font-semibold">Instructions:</strong> {label.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReturnLabelPrintable

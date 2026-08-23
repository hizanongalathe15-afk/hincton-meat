import { useState, useEffect } from 'react'
import { Gift, Search, Copy } from 'lucide-react'
import { giftCardsAdminApi } from '../services/adminApi'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  REDEEMED: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
}

const GiftCardsAdminPage = () => {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { loadCards() }, [filterStatus])

  const loadCards = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterStatus) params.status = filterStatus
      const data = await giftCardsAdminApi.getAll(params)
      setCards(data.giftCards || [])
    } catch { toast.error('Failed to load gift cards') }
    finally { setLoading(false) }
  }

  const filteredCards = cards.filter((c) =>
    !searchQuery ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.recipientEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalValue = cards.reduce((sum, c) => sum + c.amount, 0)
  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0)
  const activeCount = cards.filter((c) => c.status === 'ACTIVE').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gift Cards</h1>
        <p className="text-sm text-gray-500">View and manage issued gift cards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Issued</p>
          <p className="text-2xl font-bold text-gray-900">{cards.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Active Cards</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">KSh {totalValue.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Remaining: KSh {totalBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="REDEEMED">Redeemed</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Gift className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">No gift cards found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Code</th>
                <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 font-medium text-gray-500">Balance</th>
                <th className="px-4 py-3 font-medium text-gray-500">From</th>
                <th className="px-4 py-3 font-medium text-gray-500">To</th>
                <th className="px-4 py-3 font-medium text-gray-500">Occasion</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card) => (
                <tr key={card.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{card.code}</span>
                      <button onClick={() => { navigator.clipboard.writeText(card.code); toast.success('Copied!') }} className="text-gray-400 hover:text-gray-600">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">KSh {card.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">KSh {card.balance.toLocaleString()}</td>
                  <td className="px-4 py-3">{card.senderName}</td>
                  <td className="px-4 py-3">{card.recipientName}</td>
                  <td className="px-4 py-3 capitalize">{(card.occasion || 'General').toLowerCase().replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[card.status] || ''}`}>{card.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(card.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default GiftCardsAdminPage

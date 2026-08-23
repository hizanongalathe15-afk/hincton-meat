import React, { useState } from 'react'
import { 
  Gift, 
  Share2, 
  MessageCircle, 
  Copy, 
  Check, 
  Coins
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSiteContent } from '../../contexts/SiteContentContext'
import { formatPrice } from '../../utils/currency'
import toast from 'react-hot-toast'

export const LoyaltyReferralSection: React.FC = () => {
  const { user } = useAuth()
  const { profile } = useSiteContent()
  const [copied, setCopied] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState(100)

  const referralCode = `HINCTON-${user?.id?.slice(0, 5).toUpperCase() || 'NAIROBI'}`
  const userPoints = Number((user as any)?.loyaltyPoints || 0)
  const referralPoints = Number(profile?.gamification?.pointsPerReferral ?? 300)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    const text = `Get KSh 300 OFF your first order of fresh Naivasha pasture-raised beef, goat choma & chicken at Hincton Meat! Use my invite code: *${referralCode}* at checkout: https://hinctonmeat.com/ref/${referralCode}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <section className="py-12 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Card 1: Loyalty Points Tracker */}
          <div className="lg:col-span-6 glass-card-ultra rounded-[2.5rem] p-8 border border-white/50 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                  <Coins className="h-3.5 w-3.5" />
                  <span>Hincton Prime Rewards</span>
                </div>
                <span className="text-xs font-bold text-stone-400">1 pt = KSh 100 spent</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                Your Loyalty Balance
              </h3>

              {/* Balance Showcase */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-red-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Available Points</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-stone-900 dark:text-white">{userPoints}</span>
                    <span className="text-xs font-bold text-stone-500">Points</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-400">Redeemable Value</p>
                  <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">
                    {formatPrice(userPoints * 0.5)}
                  </p>
                </div>
              </div>

              {/* Instant Redemption Simulator */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                  <span>Redeem at Next Checkout:</span>
                  <span className="font-mono text-[var(--site-primary)] font-black">
                    {redeemPoints} Pts = -{formatPrice(redeemPoints * 0.5)} OFF
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={Math.max(50, userPoints)}
                  step={50}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[var(--site-primary)]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-500">Points never expire. Applied automatically on checkout.</span>
            </div>
          </div>

          {/* Card 2: 1-Click WhatsApp Referral Share */}
          <div className="lg:col-span-6 glass-card-ultra rounded-[2.5rem] p-8 border border-white/50 shadow-2xl flex flex-col justify-between space-y-6 bg-gradient-to-br from-white/90 via-red-500/5 to-amber-500/10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-black uppercase tracking-wider">
                <Gift className="h-3.5 w-3.5" />
                <span>Refer Friends · Earn Free Meat</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                Give KSh 300, Get KSh 300
              </h3>

              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Invite friends and family in Nairobi. When they place their first order with your unique code, they get <strong>KSh 300 OFF</strong> and you earn <strong>{referralPoints} Loyalty Points</strong> instantly!
              </p>

              {/* Referral Code Box */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border-2 border-dashed border-red-300 dark:border-red-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-black tracking-wider text-stone-400 block">Your Exclusive Referral Code</span>
                  <span className="font-mono text-base font-black text-[var(--site-primary)] tracking-widest truncate block">
                    {referralCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold hover:bg-stone-200 transition flex items-center gap-1.5 flex-shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366] text-white text-xs font-black shadow-lg hover:scale-102 transition"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Hincton Meat - Fresh Naivasha Pasture Cuts',
                      text: `Get KSh 300 OFF fresh butcher cuts with code ${referralCode}`,
                      url: `https://hinctonmeat.com/ref/${referralCode}`
                    }).catch(() => undefined)
                  } else {
                    handleCopyCode()
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-stone-900 text-white text-xs font-black shadow-lg hover:scale-102 transition"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Invite Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LoyaltyReferralSection

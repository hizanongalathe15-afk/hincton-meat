import { Loader2, ShieldCheck, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

export default function QrLoginApprovePage() {
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [approving, setApproving] = useState(false)
  const id = params.get('id') || ''
  const approve = async () => {
    if (!id) return toast.error('This QR sign-in link is invalid.')
    setApproving(true)
    try { await api.post('/auth/qr-login/approve', { id }); toast.success('Sign-in approved securely.'); navigate('/profile') } catch (error: any) { toast.error(error.response?.data?.error || 'This QR sign-in request cannot be approved.') } finally { setApproving(false) }
  }
  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[var(--site-primary)]" /></div>
  if (!user) return <div className="grid min-h-screen place-items-center bg-[var(--site-page)] p-5"><section className="max-w-md rounded-[2rem] bg-[var(--site-surface)] p-8 text-center shadow-xl"><Smartphone className="mx-auto h-11 w-11 text-[var(--site-primary)]" /><h1 className="mt-4 text-2xl font-black text-[var(--site-text)]">Sign in on this phone first</h1><p className="mt-2 text-sm text-[var(--site-muted)]">For your protection, open this QR link on a phone already signed in to your Hincton account.</p><button onClick={() => navigate(`/login?returnTo=${encodeURIComponent(`/qr-login?id=${id}`)}`)} className="mt-6 rounded-xl bg-[var(--site-primary)] px-5 py-3 font-bold text-[var(--site-buttonText)]">Sign in securely</button></section></div>
  return <div className="grid min-h-screen place-items-center bg-[var(--site-page)] p-5"><section className="max-w-md rounded-[2rem] bg-[var(--site-surface)] p-8 text-center shadow-xl"><ShieldCheck className="mx-auto h-12 w-12 text-[var(--site-success)]" /><h1 className="mt-4 text-2xl font-black text-[var(--site-text)]">Approve sign-in?</h1><p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">This will sign in another browser to your account. Only approve if you started this request yourself.</p><button onClick={approve} disabled={approving || !id} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--site-primary)] px-5 py-3 font-bold text-[var(--site-buttonText)] disabled:opacity-60">{approving && <Loader2 className="h-4 w-4 animate-spin" />} Approve secure sign-in</button><button onClick={() => navigate('/profile')} className="mt-3 block w-full py-2 text-sm font-bold text-[var(--site-muted)]">Cancel</button></section></div>
}

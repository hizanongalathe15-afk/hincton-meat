import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Shield, Wrench, Lock, Unlock, RefreshCw, Download, UploadCloud, AlertTriangle, Save, Server, DatabaseBackup, Bug, CheckCircle2, Loader2, Key, Wand2 } from 'lucide-react'
import { contentApi, systemOpsApi, opsTokenStore } from '../services/adminApi'
import { defaultSiteProfile, SiteProfile, useSiteContent } from '../contexts/SiteContentContext'

type ConfirmState = {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  action: () => Promise<void>
} | null

type DevOptions = {
  verboseApiLogs: boolean
  reduceMotion: boolean
}

const DEV_OPTIONS_KEY = 'hincton_dev_options'

const loadDevOptions = (): DevOptions => {
  try {
    const raw = localStorage.getItem(DEV_OPTIONS_KEY)
    if (raw) return { verboseApiLogs: false, reduceMotion: false, ...JSON.parse(raw) }
  } catch {}
  return { verboseApiLogs: false, reduceMotion: false }
}

const AdminMaintenancePage = () => {
  const { refresh } = useSiteContent()
  const [unlocked, setUnlocked] = useState(() => Boolean(opsTokenStore.get()))
  const [adminKey, setAdminKey] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [profile, setProfile] = useState<SiteProfile>(defaultSiteProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [confirmRunning, setConfirmRunning] = useState(false)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [updateResult, setUpdateResult] = useState<any>(null)
  const [restoring, setRestoring] = useState(false)
  const [devOptions, setDevOptions] = useState<DevOptions>(loadDevOptions)
  const [keyDraft, setKeyDraft] = useState('')
  const [keyConfirm, setKeyConfirm] = useState('')
  const [keySaving, setKeySaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [data, infoData] = await Promise.all([
          contentApi.getSiteProfile(),
          systemOpsApi.getInfo().catch(() => null),
        ])
        const saved = data.profile || {}
        setProfile({
          ...defaultSiteProfile,
          ...saved,
          featureToggles: { ...defaultSiteProfile.featureToggles, ...(saved.featureToggles || {}) },
          pages: { ...defaultSiteProfile.pages, ...(saved.pages || {}) },
        })
        if (infoData?.info) setSystemInfo(infoData.info)
      } catch {
        toast.error('Could not load maintenance settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dev-reduce-motion', devOptions.reduceMotion)
    localStorage.setItem(DEV_OPTIONS_KEY, JSON.stringify(devOptions))
    localStorage.setItem('hincton_dev_verbose_logs', devOptions.verboseApiLogs ? 'true' : 'false')
  }, [devOptions])

  const updateFeatureToggle = (key: string, value: boolean | number | string) => {
    setProfile((current) => ({ ...current, featureToggles: { ...current.featureToggles, [key]: value } }))
  }

  const generateSecretKey = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    const generated = Array.from(bytes).map((byte) => chars[byte % chars.length]).join('')
    setKeyDraft(generated)
    setKeyConfirm(generated)
  }

  const saveSecretKey = async () => {
    const key = keyDraft.trim()
    if (key.length < 8) return toast.error('Secret key must be at least 8 characters')
    if (key !== keyConfirm.trim()) return toast.error('Secret keys do not match')
    setKeySaving(true)
    try {
      const updated: SiteProfile = {
        ...profile,
        featureToggles: { ...profile.featureToggles, maintenanceSecretKey: key },
      }
      await contentApi.updateSiteProfile(updated)
      setProfile(updated)
      await refresh()
      toast.success('Secret key saved. You can now control maintenance mode.')
    } catch {
      toast.error('Could not save secret key')
    } finally {
      setKeySaving(false)
    }
  }

  const unlock = async () => {
    if (!adminKey.trim()) return toast.error('Enter your admin password to unlock')
    setUnlocking(true)
    try {
      const { opsToken, expiresIn } = await systemOpsApi.verifyAdminKey(adminKey)
      opsTokenStore.set(opsToken, expiresIn)
      setUnlocked(true)
      setAdminKey('')
      toast.success('Maintenance console unlocked for 15 minutes')
    } catch {
      toast.error('Invalid admin key')
    } finally {
      setUnlocking(false)
    }
  }

  const lock = () => {
    opsTokenStore.clear()
    setUnlocked(false)
    toast('Maintenance console locked')
  }

  const runConfirmed = async () => {
    if (!confirm) return
    setConfirmRunning(true)
    try {
      await confirm.action()
      setConfirm(null)
    } catch (error: any) {
      if (error?.response?.status === 423) {
        opsTokenStore.clear()
        setUnlocked(false)
        toast.error('Session expired. Unlock again with your admin key.')
      } else {
        toast.error(error?.response?.data?.error || 'Action failed')
      }
    } finally {
      setConfirmRunning(false)
    }
  }

  const applyMaintenanceChanges = () => {
    setConfirm({
      title: 'Apply maintenance changes?',
      message: 'These settings change how visitors experience the site immediately. Make sure you have reviewed everything before applying.',
      confirmLabel: 'Apply changes',
      action: async () => {
        setSaving(true)
        try {
          await contentApi.updateSiteProfile(profile)
          await refresh()
          toast.success('Maintenance settings applied')
        } finally {
          setSaving(false)
        }
      },
    })
  }

  const checkUpdates = () => {
    setConfirm({
      title: 'Check for system updates?',
      message: 'This contacts the backend to verify the deployed build and runtime versions.',
      confirmLabel: 'Check updates',
      action: async () => {
        setCheckingUpdates(true)
        try {
          const result = await systemOpsApi.checkUpdates()
          setUpdateResult(result)
          toast.success('Update check complete')
        } finally {
          setCheckingUpdates(false)
        }
      },
    })
  }

  const downloadBackup = () => {
    setConfirm({
      title: 'Create a system backup?',
      message: 'A JSON snapshot of all system settings (site content, theme, configuration) will be downloaded. Store it somewhere safe.',
      confirmLabel: 'Download backup',
      action: async () => {
        const blob = await systemOpsApi.downloadBackup()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `hincton-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('Backup downloaded')
      },
    })
  }

  const restoreBackup = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result))
        if (backup?.meta?.type !== 'hincton-system-backup') {
          toast.error('Not a valid Hincton backup file')
          return
        }
        const count = backup.systemSettings?.length || 0
        setConfirm({
          title: 'Restore from backup?',
          message: `This will overwrite ${count} system setting entries with the contents of "${file.name}" (created ${backup.meta.createdAt ? new Date(backup.meta.createdAt).toLocaleString() : 'unknown date'}). This cannot be undone.`,
          confirmLabel: 'Restore backup',
          danger: true,
          action: async () => {
            setRestoring(true)
            try {
              const result = await systemOpsApi.restoreBackup(backup)
              await refresh()
              toast.success(`Backup restored (${result.restored} entries)`)
            } finally {
              setRestoring(false)
            }
          },
        })
      } catch {
        toast.error('Could not read backup file')
      }
    }
    reader.readAsText(file)
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-center text-xl font-bold text-gray-950">Restricted Area</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This console controls maintenance mode, system updates, backups and recovery. Enter your admin password to unlock it.
          </p>
          <input
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && unlock()}
            placeholder="Admin password"
            className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={unlock}
            disabled={unlocking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60"
          >
            {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
            Unlock Console
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="p-10 text-center text-sm text-gray-500">Loading maintenance console…</div>
  }

  if (!String(profile.featureToggles.maintenanceSecretKey || '').trim()) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-8 shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Key className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-center text-xl font-bold text-gray-950">Create your maintenance secret key</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            First time here? Create a secret key before using maintenance mode. It is saved securely in our database and lets you open the site with
            <code className="mx-1 rounded bg-amber-100 px-1">?maintenance_key=YOUR_KEY</code>
            while visitors see the maintenance page.
          </p>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">New secret key</span>
              <input
                type="text"
                value={keyDraft}
                onChange={(event) => setKeyDraft(event.target.value)}
                placeholder="At least 8 characters"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Confirm secret key</span>
              <input
                type="text"
                value={keyConfirm}
                onChange={(event) => setKeyConfirm(event.target.value)}
                placeholder="Type the same key again"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
            </label>
            {keyDraft && keyConfirm && keyDraft.trim() !== keyConfirm.trim() && (
              <p className="text-xs font-medium text-red-600">The two keys do not match yet.</p>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={generateSecretKey}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-500 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
            >
              <Wand2 className="h-4 w-4" /> Generate for me
            </button>
            <button
              type="button"
              onClick={saveSecretKey}
              disabled={keySaving || !keyDraft.trim() || !keyConfirm.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60"
            >
              {keySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Secret Key
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-950">Maintenance & System Operations</h1>
            <p className="text-sm text-gray-600">Maintenance mode, updates, backups & recovery, developer options.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={lock}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          <Lock className="h-4 w-4" /> Lock console
        </button>
      </div>

      <section className="rounded border-2 border-amber-400 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-900">Maintenance Mode</h2>
            <p className="mt-1 text-sm text-amber-700">Control how visitors see maintenance. Choose a display mode and customize every word.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded border border-amber-300 bg-white p-3">
            <input
              type="checkbox"
              checked={Boolean(profile.featureToggles.maintenanceMode)}
              onChange={(event) => updateFeatureToggle('maintenanceMode', event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <div className="flex-1">
              <span className="text-sm font-bold text-amber-900">Enable Maintenance Mode</span>
              <p className="mt-0.5 text-xs text-amber-700">When ON, visitors see the maintenance display you configure below.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 rounded border border-amber-300 bg-white p-3">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-amber-900">Secret Backdoor Key</span>
              <input
                type="text"
                value={String(profile.featureToggles.maintenanceSecretKey || '')}
                onChange={(event) => updateFeatureToggle('maintenanceSecretKey', event.target.value)}
                placeholder="e.g. hincton2026secret"
                className="mt-1 w-full rounded border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
              <p className="mt-0.5 text-xs text-amber-600">Append <code className="rounded bg-amber-100 px-1">?maintenance_key=THIS_VALUE</code> to bypass maintenance.</p>
            </div>
          </label>
        </div>

        <div className="mt-5 rounded border border-amber-300 bg-white p-4">
          <span className="text-sm font-bold text-amber-900">Display Mode</span>
          <p className="mt-1 text-xs text-amber-700">Choose how maintenance is shown to visitors.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { value: 'full', label: 'Full Page', desc: 'Blocks all access. Visitors see a full-screen maintenance page.' },
              { value: 'banner', label: 'Top Banner', desc: 'Site works normally. A thin amber bar warns visitors at the top.' },
              { value: 'popup', label: 'Glass Popup', desc: 'Site works normally. A frosted-glass modal pops up once.' },
            ].map((mode) => (
              <label
                key={mode.value}
                className={`cursor-pointer rounded-lg border p-3 transition ${
                  profile.featureToggles.maintenanceDisplayMode === mode.value
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500'
                    : 'border-gray-200 bg-gray-50 hover:border-amber-300'
                }`}
              >
                <input
                  type="radio"
                  name="maintenanceDisplayMode"
                  value={mode.value}
                  checked={profile.featureToggles.maintenanceDisplayMode === mode.value}
                  onChange={(event) => updateFeatureToggle('maintenanceDisplayMode', event.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-bold text-gray-900">{mode.label}</span>
                <p className="mt-1 text-xs text-gray-600">{mode.desc}</p>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-4 rounded border border-amber-300 bg-white p-4">
          <span className="text-sm font-bold text-amber-900">Full Page Content</span>
          <p className="text-xs text-amber-700">Customize what visitors see on the full maintenance page.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-gray-700">Headline</span>
              <input
                type="text"
                value={String(profile.featureToggles.maintenanceHeadline || '')}
                onChange={(event) => updateFeatureToggle('maintenanceHeadline', event.target.value)}
                placeholder="We'll Be Right Back!"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-700">Estimated Downtime</span>
              <input
                type="text"
                value={String(profile.featureToggles.maintenanceEstimatedTime || '')}
                onChange={(event) => updateFeatureToggle('maintenanceEstimatedTime', event.target.value)}
                placeholder="~15 minutes"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-gray-700">Main Message</span>
            <textarea
              value={String(profile.featureToggles.maintenanceMessage || '')}
              onChange={(event) => updateFeatureToggle('maintenanceMessage', event.target.value)}
              placeholder="We're currently making some exciting upgrades..."
              rows={3}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-gray-700">Contact Email</span>
              <input
                type="email"
                value={String(profile.featureToggles.maintenanceContactEmail || '')}
                onChange={(event) => updateFeatureToggle('maintenanceContactEmail', event.target.value)}
                placeholder="support@hincton.com"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-700">Contact Phone</span>
              <input
                type="tel"
                value={String(profile.featureToggles.maintenanceContactPhone || '')}
                onChange={(event) => updateFeatureToggle('maintenanceContactPhone', event.target.value)}
                placeholder="0712-345-678"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 space-y-4 rounded border border-amber-300 bg-white p-4">
          <span className="text-sm font-bold text-amber-900">Banner Content</span>
          <p className="text-xs text-amber-700">Text shown in the top banner when mode is "Top Banner".</p>
          <label className="block">
            <span className="text-xs font-medium text-gray-700">Banner Text</span>
            <input
              type="text"
              value={String(profile.featureToggles.maintenanceBannerText || '')}
              onChange={(event) => updateFeatureToggle('maintenanceBannerText', event.target.value)}
              placeholder="We're making improvements. Some features may be temporarily unavailable."
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            />
          </label>
        </div>

        <div className="mt-5 space-y-4 rounded border border-amber-300 bg-white p-4">
          <span className="text-sm font-bold text-amber-900">Popup Content</span>
          <p className="text-xs text-amber-700">Content shown in the glassmorphism popup when mode is "Glass Popup".</p>
          <label className="block">
            <span className="text-xs font-medium text-gray-700">Popup Title</span>
            <input
              type="text"
              value={String(profile.featureToggles.maintenancePopupTitle || '')}
              onChange={(event) => updateFeatureToggle('maintenancePopupTitle', event.target.value)}
              placeholder="Quick Maintenance"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-700">Popup Message</span>
            <textarea
              value={String(profile.featureToggles.maintenancePopupMessage || '')}
              onChange={(event) => updateFeatureToggle('maintenancePopupMessage', event.target.value)}
              placeholder="We're making a quick fix. This feature will be back shortly."
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={applyMaintenanceChanges}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Apply Maintenance Changes
          </button>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-950">System Updates</h2>
            <p className="mt-1 text-sm text-gray-600">Runtime status, versions and update checks.</p>
          </div>
        </div>
        {systemInfo && (
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'App version', value: systemInfo.app?.version || 'unknown' },
              { label: 'Node.js', value: systemInfo.nodeVersion },
              { label: 'Hosting', value: systemInfo.hosting },
              { label: 'Environment', value: systemInfo.environment },
              { label: 'Uptime', value: `${Math.floor(systemInfo.uptimeSeconds / 3600)}h ${Math.floor((systemInfo.uptimeSeconds % 3600) / 60)}m` },
              { label: 'Memory used', value: `${systemInfo.memory?.rssMb} MB` },
              { label: 'Deploy commit', value: systemInfo.deployCommit ? String(systemInfo.deployCommit).slice(0, 8) : 'local' },
              { label: 'Open tickets', value: String(systemInfo.records?.openTickets ?? 0) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                <p className="mt-1 font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={checkUpdates}
            disabled={checkingUpdates}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {checkingUpdates ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Check for Updates
          </button>
          {updateResult && (
            <span className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4" /> {updateResult.message}
            </span>
          )}
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <DatabaseBackup className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-950">Backup & Recovery</h2>
            <p className="mt-1 text-sm text-gray-600">Download a snapshot of system settings, or restore from a previous backup.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-900">Create backup</h3>
            <p className="mt-1 text-xs text-gray-600">Exports all system settings (site content, theme, configuration) as a JSON file.</p>
            <button
              type="button"
              onClick={downloadBackup}
              className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              <Download className="h-4 w-4" /> Download Backup
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-900">Restore from backup</h3>
            <p className="mt-1 text-xs text-gray-600">Overwrites current system settings with the selected backup file. This cannot be undone.</p>
            <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-600 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Choose Backup File
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) restoreBackup(file)
                  event.target.value = ''
                }}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <Bug className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-950">Developer Options</h2>
            <p className="mt-1 text-sm text-gray-600">Local debugging tools for this browser only. They do not affect visitors.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded border border-gray-200 p-3">
            <input
              type="checkbox"
              checked={devOptions.verboseApiLogs}
              onChange={(event) => setDevOptions((current) => ({ ...current, verboseApiLogs: event.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div>
              <span className="text-sm font-semibold text-gray-800">Verbose API logs</span>
              <p className="mt-0.5 text-xs text-gray-500">Print every admin API request in the browser console.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 rounded border border-gray-200 p-3">
            <input
              type="checkbox"
              checked={devOptions.reduceMotion}
              onChange={(event) => setDevOptions((current) => ({ ...current, reduceMotion: event.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div>
              <span className="text-sm font-semibold text-gray-800">Reduce motion</span>
              <p className="mt-0.5 text-xs text-gray-500">Disable animations and transitions to debug layout issues.</p>
            </div>
          </label>
        </div>
      </section>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${confirm.danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-950">{confirm.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{confirm.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !confirmRunning && setConfirm(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runConfirmed}
                disabled={confirmRunning}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${confirm.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'}`}
              >
                {confirmRunning && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminMaintenancePage

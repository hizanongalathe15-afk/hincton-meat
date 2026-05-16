import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { Camera, Eye, EyeOff, Lock, Mail, Save, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getApiHost } from '../services/api'
import { userApi } from '../services/buyerApi'
import toast from 'react-hot-toast'

type ProfileForm = {
  name: string
  firstName: string
  lastName: string
  username: string
  phone: string
  bio: string
  website: string
  avatar: string
  coverImage: string
}

const initialsFor = (value?: string) => {
  const source = value?.trim() || 'Admin'
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

const AdminProfilePage = () => {
  const { user, updateProfile, updateAvatar } = useAuth()
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    bio: '',
    website: '',
    avatar: '',
    coverImage: '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordVisibility, setPasswordVisibility] = useState({ current: false, next: false, confirm: false })

  useEffect(() => {
    setForm({
      name: user?.profile?.fullName || user?.name || '',
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      username: user?.username || '',
      phone: user?.phone || user?.profile?.mpesaPhone || '',
      bio: user?.profile?.bio || '',
      website: user?.profile?.website || '',
      avatar: user?.avatar || user?.profile?.avatar || '',
      coverImage: user?.profile?.coverImage || '',
    })
  }, [user])

  const displayName = form.name || [form.firstName, form.lastName].filter(Boolean).join(' ') || user?.email || 'Admin'
  const avatarUrl = form.avatar || user?.avatar || user?.profile?.avatar
  const coverImage = form.coverImage || user?.profile?.coverImage
  const API_HOST = getApiHost()
  const roleLabel = useMemo(() => {
    const roles = (user as any)?.roles
    if (Array.isArray(roles) && roles.length > 0) return roles.join(', ').replace(/_/g, ' ')
    return 'ADMIN'
  }, [user])

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await updateProfile({
        name: form.name.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        website: form.website.trim(),
        avatar: form.avatar.trim(),
        coverImage: form.coverImage.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await updateAvatar(file)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault()

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Fill in all password fields')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    setChangingPassword(true)
    try {
      const response = await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success(response?.message || 'Password changed successfully')
      if (response?.revokedSessions) {
        toast.success(`${response.revokedSessions} other device${response.revokedSessions === 1 ? '' : 's'} logged out`)
      }
    } catch (error: any) {
      toast.error(error?.message || 'Could not change password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="relative h-44 bg-gray-950">
          {coverImage ? (
            <img src={coverImage} alt="" className="h-full w-full object-cover opacity-85" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-950 px-6 text-center text-3xl font-bold tracking-wide text-white">
              Hincton Meat Products
            </div>
          )}
        </div>
        <div className="flex flex-col gap-5 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="-mt-14 flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-white bg-red-700 text-3xl font-bold text-white shadow-sm">
            {avatarUrl ? (
              <img src={avatarUrl.startsWith('http') ? avatarUrl : `${API_HOST}${avatarUrl}`} alt={displayName} className="h-full w-full rounded-full object-cover" />
            ) : (
              initialsFor(displayName)
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-950">Admin Profile</h1>
            <p className="mt-1 text-sm text-gray-600">Manage the signed-in admin account details and image.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 font-medium text-red-800">
                <ShieldCheck className="h-4 w-4" />
                {roleLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700">
                <Mail className="h-4 w-4" />
                {user?.email}
              </span>
            </div>
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50">
            <Camera className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" disabled={uploading} />
          </label>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-red-700">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-950">Account Details</h2>
            <p className="text-sm text-gray-600">Email is shown for reference. Use settings for security changes.</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Display name
            <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Username
            <input value={form.username} onChange={(event) => updateField('username', event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            First name
            <input value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Last name
            <input value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Phone
            <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Website
            <input value={form.website} onChange={(event) => updateField('website', event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Avatar URL
            <input value={form.avatar} onChange={(event) => updateField('avatar', event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Cover image URL
            <input value={form.coverImage} onChange={(event) => updateField('coverImage', event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700 lg:col-span-2">
            Bio
            <textarea value={form.bio} onChange={(event) => updateField('bio', event.target.value)} rows={4} className="rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      <form onSubmit={handlePasswordChange} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-red-700">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-950">Change Password</h2>
            <p className="text-sm text-gray-600">Updates this admin account immediately and logs out other signed-in devices.</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Current password
            <span className="relative">
              <input
                type={passwordVisibility.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setPasswordVisibility((current) => ({ ...current, current: !current.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                aria-label="Toggle current password visibility"
              >
                {passwordVisibility.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            New password
            <span className="relative">
              <input
                type={passwordVisibility.next ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setPasswordVisibility((current) => ({ ...current, next: !current.next }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                aria-label="Toggle new password visibility"
              >
                {passwordVisibility.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Confirm new password
            <span className="relative">
              <input
                type={passwordVisibility.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setPasswordVisibility((current) => ({ ...current, confirm: !current.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                aria-label="Toggle confirm password visibility"
              >
                {passwordVisibility.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={changingPassword} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            <Lock className="h-4 w-4" />
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminProfilePage

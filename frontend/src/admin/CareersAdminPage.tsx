import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Briefcase, Users, Download, Eye, X, Save, Search, Image, Upload } from 'lucide-react'
import { careersAdminApi, contentApi } from '../services/adminApi'
import { getApiHost } from '../services/api'
import toast from 'react-hot-toast'

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']
const STATUSES = ['OPEN', 'CLOSED', 'PAUSED']
const APPLICATION_STATUSES = ['NEW', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED']
const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  REVIEWED: 'bg-yellow-100 text-yellow-700',
  SHORTLISTED: 'bg-purple-100 text-purple-700',
  INTERVIEW: 'bg-indigo-100 text-indigo-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const emptyJobForm = {
  title: '', department: '', location: '', type: 'FULL_TIME',
  description: '', requirements: '', salaryRange: '', deadline: '',
  maxSpots: 1, googleFormUrl: '', status: 'OPEN',
}

const CareersAdminPage = () => {
  const [tab, setTab] = useState<'jobs' | 'applications' | 'content'>('jobs')
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [jobForm, setJobForm] = useState(emptyJobForm)
  const [saving, setSaving] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageContent, setPageContent] = useState<any>(null)
  const [savingContent, setSavingContent] = useState(false)

  useEffect(() => { loadJobs() }, [])
  useEffect(() => { if (tab === 'applications') loadApplications() }, [tab, filterStatus, filterDepartment])
  useEffect(() => { if (tab === 'content') loadPageContent() }, [tab])

  const loadJobs = async () => {
    try {
      const data = await careersAdminApi.getJobs()
      setJobs(data.jobs || [])
    } catch { toast.error('Failed to load jobs') }
    finally { setLoading(false) }
  }

  const loadApplications = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterStatus) params.status = filterStatus
      if (filterDepartment) params.department = filterDepartment
      const data = await careersAdminApi.getApplications(params)
      setApplications(data.applications || [])
    } catch { toast.error('Failed to load applications') }
    finally { setLoading(false) }
  }

  const openCreateJob = () => {
    setEditingJob(null)
    setJobForm(emptyJobForm)
    setShowJobModal(true)
  }

  const openEditJob = (job: any) => {
    setEditingJob(job)
    setJobForm({
      title: job.title, department: job.department, location: job.location,
      type: job.type, description: job.description, requirements: job.requirements,
      salaryRange: job.salaryRange || '', deadline: job.deadline ? job.deadline.split('T')[0] : '',
      maxSpots: job.maxSpots, googleFormUrl: job.googleFormUrl || '', status: job.status,
    })
    setShowJobModal(true)
  }

  const handleSaveJob = async () => {
    if (!jobForm.title || !jobForm.department || !jobForm.location || !jobForm.description || !jobForm.requirements) {
      toast.error('Please fill in all required fields')
      return
    }
    setSaving(true)
    try {
      const payload = { ...jobForm, maxSpots: Number(jobForm.maxSpots), deadline: jobForm.deadline || null, salaryRange: jobForm.salaryRange || null, googleFormUrl: jobForm.googleFormUrl || null }
      if (editingJob) {
        await careersAdminApi.updateJob(editingJob.id, payload)
        toast.success('Job updated')
      } else {
        await careersAdminApi.createJob(payload)
        toast.success('Job created')
      }
      setShowJobModal(false)
      loadJobs()
    } catch { toast.error('Failed to save job') }
    finally { setSaving(false) }
  }

  const handleDeleteJob = async (id: string) => {
    if (!window.confirm('Delete this job posting and all its applications?')) return
    try {
      await careersAdminApi.deleteJob(id)
      toast.success('Job deleted')
      loadJobs()
    } catch { toast.error('Failed to delete job') }
  }

  const handleStatusChange = async (appId: string, status: string) => {
    try {
      await careersAdminApi.updateApplicationStatus(appId, { status })
      toast.success('Status updated')
      loadApplications()
      if (selectedApplication?.id === appId) {
        setSelectedApplication({ ...selectedApplication, status })
      }
    } catch { toast.error('Failed to update status') }
  }

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Job', 'Department', 'Status', 'Date']
    const rows = applications.map((a: any) => [
      a.name, a.email, a.phone, a.job?.title || '', a.job?.department || '', a.status, new Date(a.createdAt).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `applications_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const departments = [...new Set(jobs.map((j) => j.department))]

  const loadPageContent = async () => {
    try {
      const data = await careersAdminApi.getPageContent()
      setPageContent(data)
    } catch { toast.error('Failed to load page content') }
  }

  const handleSaveContent = async () => {
    setSavingContent(true)
    try {
      await careersAdminApi.savePageContent(pageContent)
      toast.success('Page content saved')
    } catch { toast.error('Failed to save page content') }
    finally { setSavingContent(false) }
  }

  const handleImageUpload = async (field: string, file: File) => {
    try {
      const data = await contentApi.uploadContentImage(file)
      setPageContent((prev: any) => ({ ...prev, [field]: data.url || data.imageUrl }))
      toast.success('Image uploaded')
    } catch { toast.error('Upload failed') }
  }

  const updateContentField = (field: string, value: any) => {
    setPageContent((prev: any) => ({ ...prev, [field]: value }))
  }

  const updateCultureCard = (index: number, field: string, value: any) => {
    setPageContent((prev: any) => {
      const cards = [...(prev.cultureCards || [])]
      cards[index] = { ...cards[index], [field]: value }
      return { ...prev, cultureCards: cards }
    })
  }

  const updateHeroBar = (index: number, value: string) => {
    setPageContent((prev: any) => {
      const bars = [...(prev.heroBars || [])]
      bars[index] = value
      return { ...prev, heroBars: bars }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Careers Management</h1>
          <p className="text-sm text-gray-500">Manage job postings and applications</p>
        </div>
        <button onClick={openCreateJob} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition hover:shadow-red-600/40">
          <Plus className="h-4 w-4" /> New Job Posting
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {(['jobs', 'applications', 'content'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${tab === t ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'jobs' ? <><Briefcase className="mr-1.5 inline h-4 w-4" />Jobs ({jobs.length})</> : t === 'applications' ? <><Users className="mr-1.5 inline h-4 w-4" />Applications ({applications.length})</> : <><Image className="mr-1.5 inline h-4 w-4" />Page Content</>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
        </div>
      ) : tab === 'jobs' ? (
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">No job postings yet. Create your first one!</p>
            </div>
          ) : jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : job.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{job.department} · {job.location} · {job.type.replace('_', ' ')} · {job._count?.applications || 0} applications</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditJob(job)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => handleDeleteJob(job.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'applications' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500"
              />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
              <option value="">All Status</option>
              {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d as string}>{d as string}</option>)}
            </select>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
          <div className="space-y-2">
            {applications.filter((a: any) => !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.email.toLowerCase().includes(searchQuery.toLowerCase())).map((app: any) => (
              <div key={app.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md">
                <div className="flex-1 cursor-pointer" onClick={() => setSelectedApplication(app)}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{app.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-700'}`}>{app.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">{app.email} · {app.job?.title} · {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setSelectedApplication(app)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {pageContent ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Careers Page Visuals</h2>
                <button onClick={handleSaveContent} disabled={savingContent} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  <Save className="h-4 w-4" />{savingContent ? 'Saving...' : 'Save All'}
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <h3 className="font-semibold text-gray-800">Hero Section Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['heroImage', 'section2Image', 'section3Img1', 'section3Img2', 'section3Bg'].map(field => (
                    <div key={field}>
                      <label className="text-xs font-medium text-gray-600 block mb-1">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <div className="flex items-center gap-2">
                        {pageContent[field] && <img src={pageContent[field]} alt="" className="h-12 w-16 rounded object-cover border" />}
                        <input type="text" value={pageContent[field] || ''} onChange={e => updateContentField(field, e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs" />
                        <label className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200">
                          <Upload className="inline h-3 w-3 mr-1" />Upload
                          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(field, e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <h3 className="font-semibold text-gray-800">Hero Feature Bars</h3>
                {(pageContent.heroBars || []).map((bar: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400 w-4">{i + 1}</span>
                    <input type="text" value={bar} onChange={e => updateHeroBar(i, e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <h3 className="font-semibold text-gray-800">Text Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['heroTitle', 'heroSubtitle', 'heroCtaLabel', 'section2Title', 'section2Subtitle', 'section2CtaLabel', 'section2CtaText', 'section3Heading', 'section3Subheading', 'infoCard1Title', 'infoCard2Title', 'infoCardCtaLabel', 'infoCardCtaText'].map(field => (
                    <div key={field}>
                      <label className="text-xs font-medium text-gray-600 block mb-1">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input type="text" value={pageContent[field] || ''} onChange={e => updateContentField(field, e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <h3 className="font-semibold text-gray-800">Culture Cards</h3>
                {(pageContent.cultureCards || []).map((card: any, i: number) => (
                  <div key={i} className="grid grid-cols-3 gap-3 items-end border-b border-gray-100 pb-3">
                    <div>
                      <label className="text-xs text-gray-500 block">Title (use \\n for line break)</label>
                      <input type="text" value={card.title} onChange={e => updateCultureCard(i, 'title', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block">Subtitle</label>
                      <input type="text" value={card.subtitle || ''} onChange={e => updateCultureCard(i, 'subtitle', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Active</label>
                      <input type="checkbox" checked={card.active} onChange={e => updateCultureCard(i, 'active', e.target.checked)} className="rounded accent-red-600" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            </div>
          )}
        </div>
      )}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setShowJobModal(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingJob ? 'Edit Job Posting' : 'New Job Posting'}</h2>
              <button onClick={() => setShowJobModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(['title', 'department', 'location'] as const).map((f) => (
                <div key={f} className={f === 'title' ? 'col-span-2' : ''}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{f.charAt(0).toUpperCase() + f.slice(1)} *</label>
                  <input type="text" value={jobForm[f]} onChange={(e) => setJobForm({ ...jobForm, [f]: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500" />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Type *</label>
                <select value={jobForm.type} onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                <select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Max Spots</label>
                <input type="number" min={1} value={jobForm.maxSpots} onChange={(e) => setJobForm({ ...jobForm, maxSpots: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Salary Range</label>
                <input type="text" value={jobForm.salaryRange} onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })} placeholder="e.g. KSh 50,000 - 80,000" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Deadline</label>
                <input type="date" value={jobForm.deadline} onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Google Form URL</label>
                <input type="url" value={jobForm.googleFormUrl} onChange={(e) => setJobForm({ ...jobForm, googleFormUrl: e.target.value })} placeholder="https://forms.google.com/..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
                <textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Requirements * (one per line)</label>
                <textarea value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowJobModal(false)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveJob} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : editingJob ? 'Update Job' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedApplication(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
              <button onClick={() => setSelectedApplication(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div><span className="text-sm font-medium text-gray-500">Name:</span><p className="font-semibold text-gray-900">{selectedApplication.name}</p></div>
              <div><span className="text-sm font-medium text-gray-500">Email:</span><p className="text-gray-900">{selectedApplication.email}</p></div>
              <div><span className="text-sm font-medium text-gray-500">Phone:</span><p className="text-gray-900">{selectedApplication.phone}</p></div>
              <div><span className="text-sm font-medium text-gray-500">Job:</span><p className="text-gray-900">{selectedApplication.job?.title} ({selectedApplication.job?.department})</p></div>
              <div><span className="text-sm font-medium text-gray-500">Date:</span><p className="text-gray-900">{new Date(selectedApplication.createdAt).toLocaleString()}</p></div>
              {selectedApplication.coverLetter && (
                <div><span className="text-sm font-medium text-gray-500">Cover Letter:</span><p className="whitespace-pre-line text-gray-700">{selectedApplication.coverLetter}</p></div>
              )}
              {selectedApplication.cvUrl && (
                <div>
                  <span className="text-sm font-medium text-gray-500">CV:</span>
                  <a href={`${getApiHost()}${selectedApplication.cvUrl}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-sm font-medium text-red-600 underline">Download CV</a>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {APPLICATION_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedApplication.id, s)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${selectedApplication.status === s ? STATUS_COLORS[s] : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CareersAdminPage

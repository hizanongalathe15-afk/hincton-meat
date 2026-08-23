import { Router, Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { authenticate, requireAdmin, apiRateLimiter, asyncHandler, authRateLimiter } from '../middleware'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// CV upload config
const cvUploadPath = path.join(process.env.UPLOAD_DIR || 'uploads', 'documents')
fs.mkdirSync(cvUploadPath, { recursive: true })
const cvUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, cvUploadPath),
    filename: (_req, file, cb) => cb(null, `cv-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) return cb(null, true)
    cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'))
  },
})

const CAREERS_PAGE_KEY = 'careers_page_content'

const defaultCareersContent = {
  heroImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1280&q=80',
  section2Image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1280&q=80',
  section3Img1: 'https://images.unsplash.com/photo-1577219491135-ce391738fbfc?w=1280&q=80',
  section3Img2: 'https://images.unsplash.com/photo-1551218808-94e220242969?w=1280&q=80',
  section3Bg: 'https://images.unsplash.com/photo-1504672281656-e4981d70414b?w=1280&q=80',
  heroBars: ['Premium Quality Meats', 'Expert Butchery Team', 'Trusted by Thousands'],
  heroTitle: 'We deliver the finest cuts with passion and expertise',
  heroSubtitle: 'Join the Hincton Meat Family',
  heroCtaLabel: 'View Open Positions',
  section2Title: 'Our Culture',
  section2Subtitle: 'What makes us different',
  section2CtaLabel: 'See Openings',
  section2CtaText: 'Want to be part of something great? Explore our current openings.',
  cultureCards: [
    { title: 'Our\nCraft', subtitle: 'Artisan butchery meets modern standards', active: true },
    { title: 'Growth\nPath', subtitle: 'We invest in our team development', active: false },
    { title: 'Team\nSpirit', subtitle: 'A family that works hard and celebrates harder', active: false },
    { title: 'Fresh\nDaily', subtitle: null, active: false },
  ],
  section3Heading: 'Open\nPositions',
  section3Subheading: 'Join Our Team',
  infoCard1Title: 'The Hiring\nProcess',
  infoCard2Title: 'Benefits &\nPerks',
  infoCardCtaLabel: 'Apply Now',
  infoCardCtaText: 'Consultation',
}

function parseJsonValue(val: string | null | undefined): any {
  if (!val) return null
  try { return JSON.parse(val) } catch { return null }
}

router.get('/page-content', apiRateLimiter, asyncHandler(async (_req: Request, res: Response) => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: CAREERS_PAGE_KEY } })
  const saved = setting ? parseJsonValue(setting.value) : null
  res.json(saved || defaultCareersContent)
}))

router.put('/page-content', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const content = req.body
  await prisma.systemSetting.upsert({
    where: { key: CAREERS_PAGE_KEY },
    update: { value: JSON.stringify(content), type: 'json', group: 'careers' },
    create: { key: CAREERS_PAGE_KEY, value: JSON.stringify(content), type: 'json', group: 'careers', description: 'Careers page visual content', isPublic: true },
  })
  res.json({ message: 'Careers page content updated' })
}))

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// List active job postings
router.get('/jobs', apiRateLimiter, asyncHandler(async (_req: Request, res: Response) => {
  const jobs = await prisma.jobPosting.findMany({
    where: { status: 'OPEN' },
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      department: true,
      location: true,
      type: true,
      description: true,
      requirements: true,
      salaryRange: true,
      deadline: true,
      maxSpots: true,
      googleFormUrl: true,
      status: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
  })

  const enriched = jobs.map((job) => ({
    ...job,
    spotsRemaining: Math.max(0, job.maxSpots - job._count.applications),
    spotsAvailable: job._count.applications < job.maxSpots,
  }))

  res.json({ jobs: enriched })
}))

// Single job detail
router.get('/jobs/:id', apiRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const job = await prisma.jobPosting.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { applications: true } },
    },
  })

  if (!job) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  res.json({
    job: {
      ...job,
      spotsRemaining: Math.max(0, job.maxSpots - job._count.applications),
      spotsAvailable: job._count.applications < job.maxSpots,
    },
  })
}))

// Submit application
router.post('/apply/:jobId', authRateLimiter, cvUpload.single('cv'), asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params
  const { name, email, phone, coverLetter } = req.body

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' })
  }

  // Honeypot check
  if (req.body.website_url || req.body.fax_number) {
    return res.status(400).json({ error: 'Invalid submission' })
  }

  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: { _count: { select: { applications: true } } },
  })

  if (!job || job.status !== 'OPEN') {
    return res.status(404).json({ error: 'Job posting not found or no longer accepting applications' })
  }

  if (job._count.applications >= job.maxSpots) {
    return res.status(400).json({ error: 'This position is no longer accepting applications' })
  }

  const cvUrl = req.file ? `/uploads/documents/${req.file.filename}` : null

  const application = await prisma.jobApplication.create({
    data: {
      jobId,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      coverLetter: coverLetter ? String(coverLetter).trim() : null,
      cvUrl,
    },
  })

  res.status(201).json({ application, message: 'Application submitted successfully' })
}))

// ============================================================================
// ADMIN ROUTES
// ============================================================================

router.use(authenticate)
router.use(requireAdmin)

// Create job posting
router.post('/jobs', asyncHandler(async (req: Request, res: Response) => {
  const { title, department, location, type, description, requirements, salaryRange, deadline, maxSpots, googleFormUrl, status } = req.body

  if (!title || !department || !location || !type || !description || !requirements) {
    return res.status(400).json({ error: 'Title, department, location, type, description, and requirements are required' })
  }

  const job = await prisma.jobPosting.create({
    data: {
      title: String(title).trim(),
      department: String(department).trim(),
      location: String(location).trim(),
      type: String(type).trim(),
      description: String(description).trim(),
      requirements: String(requirements).trim(),
      salaryRange: salaryRange ? String(salaryRange).trim() : null,
      deadline: deadline ? new Date(deadline) : null,
      maxSpots: Number(maxSpots) || 1,
      googleFormUrl: googleFormUrl ? String(googleFormUrl).trim() : null,
      status: status || 'OPEN',
    },
  })

  res.status(201).json({ job, message: 'Job posting created' })
}))

// Update job posting
router.put('/jobs/:id', asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.jobPosting.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  const { title, department, location, type, description, requirements, salaryRange, deadline, maxSpots, googleFormUrl, status } = req.body

  const job = await prisma.jobPosting.update({
    where: { id: req.params.id },
    data: {
      title: title !== undefined ? String(title).trim() : undefined,
      department: department !== undefined ? String(department).trim() : undefined,
      location: location !== undefined ? String(location).trim() : undefined,
      type: type !== undefined ? String(type).trim() : undefined,
      description: description !== undefined ? String(description).trim() : undefined,
      requirements: requirements !== undefined ? String(requirements).trim() : undefined,
      salaryRange: salaryRange !== undefined ? (salaryRange ? String(salaryRange).trim() : null) : undefined,
      deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
      maxSpots: maxSpots !== undefined ? Number(maxSpots) : undefined,
      googleFormUrl: googleFormUrl !== undefined ? (googleFormUrl ? String(googleFormUrl).trim() : null) : undefined,
      status: status !== undefined ? String(status).trim() : undefined,
    },
  })

  res.json({ job, message: 'Job posting updated' })
}))

// Delete job posting
router.delete('/jobs/:id', asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.jobPosting.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  await prisma.jobPosting.delete({ where: { id: req.params.id } })
  res.json({ message: 'Job posting deleted' })
}))

// List all applications with filters
router.get('/applications', asyncHandler(async (req: Request, res: Response) => {
  const { status, department, jobId, page = 1, limit = 20 } = req.query

  const where: any = {}
  if (status) where.status = String(status)
  if (jobId) where.jobId = String(jobId)
  if (department) {
    where.job = { department: String(department) }
  }

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      include: { job: { select: { title: true, department: true } } },
      orderBy: [{ createdAt: 'desc' }],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.jobApplication.count({ where }),
  ])

  res.json({
    applications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  })
}))

// Single application detail
router.get('/applications/:id', asyncHandler(async (req: Request, res: Response) => {
  const application = await prisma.jobApplication.findUnique({
    where: { id: req.params.id },
    include: { job: true },
  })

  if (!application) {
    return res.status(404).json({ error: 'Application not found' })
  }

  res.json({ application })
}))

// Update application status
router.put('/applications/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { status, notes } = req.body
  const validStatuses = ['NEW', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED']

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` })
  }

  const application = await prisma.jobApplication.update({
    where: { id: req.params.id },
    data: {
      status,
      notes: notes !== undefined ? String(notes).trim() : undefined,
    },
  })

  res.json({ application, message: 'Application status updated' })
}))

export default router

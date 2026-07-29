import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()
const settingKey = 'company_directory'
const entrySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(8).max(12000),
  location: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().default(''),
  website: z.string().trim().max(240).optional().default(''),
  image: z.string().trim().max(1000).optional().default(''),
  gallery: z.array(z.string().trim().max(1000)).max(20).default([]),
  video: z.string().trim().max(1000).optional().default(''),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  imageMotion: z.enum(['float', 'zoom', 'none']).default('float'),
  status: z.enum(['Open', 'Coming soon']).default('Open'),
})

type Company = z.infer<typeof entrySchema> & { id: string }

const readDirectory = async (): Promise<Company[]> => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: settingKey } })
  if (!setting) return []
  try {
    const parsed = JSON.parse(setting.value)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

const writeDirectory = async (companies: Company[]) => prisma.systemSetting.upsert({
  where: { key: settingKey },
  update: { value: JSON.stringify(companies), type: 'json', group: 'company-directory', isPublic: true },
  create: { key: settingKey, value: JSON.stringify(companies), type: 'json', group: 'company-directory', description: 'Public branches and partner companies', isPublic: true },
})

router.get('/', async (_req, res) => res.json({ companies: await readDirectory() }))

router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  const input = entrySchema.parse(req.body)
  const companies = await readDirectory()
  const company: Company = { ...input, id: crypto.randomUUID() }
  companies.push(company)
  await writeDirectory(companies)
  res.status(201).json({ company })
})

router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  const input = entrySchema.parse(req.body)
  const companies = await readDirectory()
  const index = companies.findIndex((company) => company.id === req.params.id)
  if (index < 0) return res.status(404).json({ error: 'Company not found' })
  const company: Company = { ...input, id: req.params.id }
  companies[index] = company
  await writeDirectory(companies)
  res.json({ company })
})

router.put('/reorder/list', authenticate, authorize('ADMIN'), async (req, res) => {
  const ids = z.object({ ids: z.array(z.string()).max(100) }).parse(req.body).ids
  const companies = await readDirectory()
  if (ids.length !== companies.length || new Set(ids).size !== ids.length || ids.some((id) => !companies.some((company) => company.id === id))) {
    return res.status(400).json({ error: 'The supplied directory order is invalid' })
  }
  const byId = new Map(companies.map((company) => [company.id, company]))
  const reordered = ids.map((id) => byId.get(id)!).filter(Boolean)
  await writeDirectory(reordered)
  res.json({ companies: reordered })
})

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  const companies = await readDirectory()
  const filtered = companies.filter((company) => company.id !== req.params.id)
  if (filtered.length === companies.length) return res.status(404).json({ error: 'Company not found' })
  await writeDirectory(filtered)
  res.status(204).send()
})

export default router

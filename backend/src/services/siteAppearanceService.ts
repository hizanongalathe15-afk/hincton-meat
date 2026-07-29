import { prisma } from '../config/prisma'
import {
  BLANK_SITE_THEME,
  DEFAULT_SITE_THEME,
  buildBlankSiteProfile,
  mergeTheme,
  normalizeTheme,
} from '../constants/siteAppearance'

const PROFILE_KEY = 'site_profile'
const THEME_KEY = 'site_theme'

const parseJsonValue = <T>(value: string | undefined, fallback: T): T => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const upsertPublicSetting = async (key: string, value: unknown, meta: { group: string; description: string }) => {
  const payload = JSON.stringify(value)
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value: payload, type: 'json', group: meta.group, isPublic: true },
    create: {
      key,
      value: payload,
      type: 'json',
      group: meta.group,
      description: meta.description,
      isPublic: true,
    },
  })
}

export const siteAppearanceService = {
  async getTheme() {
    const setting = await prisma.systemSetting.findUnique({ where: { key: THEME_KEY } })
    const saved = setting ? parseJsonValue<Record<string, string>>(setting.value, {}) : {}
    return mergeTheme(saved)
  },

  async saveTheme(theme: Record<string, string>) {
    const normalized = normalizeTheme(theme)
    await upsertPublicSetting(THEME_KEY, normalized, {
      group: 'appearance',
      description: 'Storefront colour palette and custom theme tokens',
    })
    return normalized
  },

  async getProfile(defaultProfile: Record<string, unknown>) {
    const setting = await prisma.systemSetting.findUnique({ where: { key: PROFILE_KEY } })
    const saved = setting ? parseJsonValue<Record<string, unknown>>(setting.value, {}) : {}
    return { ...defaultProfile, ...saved }
  },

  async saveProfile(profile: Record<string, unknown>) {
    await upsertPublicSetting(PROFILE_KEY, profile, {
      group: 'site',
      description: 'Editable public site profile content',
    })
    return profile
  },

  async getAppearance(defaultProfile: Record<string, unknown>) {
    const [profile, theme] = await Promise.all([
      this.getProfile(defaultProfile),
      this.getTheme(),
    ])
    return { profile, theme }
  },

  async resetAppearance(
    mode: 'blank' | 'defaults',
    targets: Array<'profile' | 'theme' | 'all'>,
    defaultProfile: Record<string, unknown>,
  ) {
    const resetProfile = targets.includes('profile') || targets.includes('all')
    const resetTheme = targets.includes('theme') || targets.includes('all')

    let profile = resetProfile
      ? (mode === 'blank' ? buildBlankSiteProfile() : { ...defaultProfile })
      : await this.getProfile(defaultProfile)

    let theme = resetTheme
      ? (mode === 'blank' ? { ...BLANK_SITE_THEME } : { ...DEFAULT_SITE_THEME })
      : await this.getTheme()

    if (resetProfile) {
      await this.saveProfile(profile as Record<string, unknown>)
    }
    if (resetTheme) {
      theme = await this.saveTheme(theme)
    }

    return { profile, theme, mode, targets }
  },

  async deleteAppearance(targets: Array<'profile' | 'theme' | 'all'>) {
    const keys: string[] = []
    if (targets.includes('profile') || targets.includes('all')) keys.push(PROFILE_KEY)
    if (targets.includes('theme') || targets.includes('all')) keys.push(THEME_KEY)
    if (keys.length) {
      await prisma.systemSetting.deleteMany({ where: { key: { in: keys } } })
    }
    return { deleted: keys }
  },
}

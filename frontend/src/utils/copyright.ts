import type { SiteProfile } from '../contexts/SiteContentContext'

export type FooterCopyrightSettings = SiteProfile['footer'] & { brandName: string | undefined }

export const buildCopyrightText = (
  footer: Partial<FooterCopyrightSettings> | undefined,
  brandName: string | undefined,
): string => {
  const currentYear = new Date().getFullYear()
  const settings = footer || {}
  const startYear = settings.startYear ?? currentYear
  const autoUpdate = settings.autoUpdateCurrentYear ?? true
  const endYear = settings.endYear
  const companyName = settings.companyName || brandName || 'Hincton Meat Products'
  const allRightsText = settings.allRightsReservedText
  const customLine = settings.customCopyrightLine

  if (customLine && customLine.trim().length > 0) {
    return customLine
  }

  const displayEndYear = autoUpdate ? currentYear : (endYear ?? currentYear)
  const yearPortion = startYear < displayEndYear ? `${startYear}-${displayEndYear}` : `${displayEndYear}`

  const segments: string[] = [`© ${yearPortion} ${companyName}`]
  if (allRightsText && allRightsText.trim().length > 0) {
    segments.push(allRightsText.trim())
  }
  return segments.join('. ')
}

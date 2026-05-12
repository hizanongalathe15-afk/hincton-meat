import en from './dictionaries/en.json'
import sw from './dictionaries/sw.json'
import fr from './dictionaries/fr.json'
import de from './dictionaries/de.json'

export type LocaleCode = 'en' | 'sw' | 'fr' | 'de'

const DICTS: Record<LocaleCode, Record<string, string>> = {
  en,
  sw,
  fr,
  de,
}

export const FALLBACK_LOCALE: LocaleCode = 'en'

export const resolveLocale = (raw?: string | null): LocaleCode => {
  const code = String(raw || '').trim().toLowerCase()
  if (code === 'sw' || code === 'en' || code === 'fr' || code === 'de') return code
  return FALLBACK_LOCALE
}

export const tFactory = (locale?: LocaleCode | null) => {
  const resolved = resolveLocale(locale)
  const dict = DICTS[resolved] || DICTS[FALLBACK_LOCALE]
  return (key: string): string => {
    return dict[key] ?? DICTS[FALLBACK_LOCALE][key] ?? key
  }
}


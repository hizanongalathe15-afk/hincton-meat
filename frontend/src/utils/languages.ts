export type LanguageOption = {
  code: string
  label: string
}

// Single source of truth for frontend language options.
// IMPORTANT: values are language codes persisted in settings (e.g. "en", "sw").
export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Swahili' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
]



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

const COMMON_LITERALS: Record<LocaleCode, Record<string, string>> = {
  en: {},
  sw: {
    'Analytics Overview': 'Muhtasari wa Uchambuzi',
    'Key performance metrics and trends': 'Vipimo muhimu vya utendaji na mwenendo',
    'Live Visits': 'Ziara za Moja kwa Moja',
    'Real project page opens and link taps today': 'Ufunguaji wa kurasa na mibofyo ya viungo ya leo',
    'Visits Today': 'Ziara Leo',
    'Unique Visitors': 'Wageni wa Kipekee',
    'Active Now': 'Waliopo Sasa',
    'Link Taps Today': 'Mibofyo ya Viungo Leo',
    'Top Pages Today': 'Kurasa Zinazoongoza Leo',
    'Top Link Taps Today': 'Viungo Vilivyobofya Zaidi Leo',
    'Recent Visits': 'Ziara za Hivi Karibuni',
    'Refresh': 'Onyesha Upya',
    'Auto Sync ON': 'Usawazishaji Otomatiki UMEWASHWA',
    'Auto Sync OFF': 'Usawazishaji Otomatiki UMEZIMWA',
    'Page': 'Ukurasa',
    'Device': 'Kifaa',
    'Language': 'Lugha',
    'Referrer': 'Chanzo',
    'Time': 'Muda',
    'No visits recorded today yet.': 'Hakuna ziara zilizorekodiwa leo bado.',
    'No link taps recorded today yet.': 'Hakuna mibofyo ya viungo iliyorekodiwa leo bado.',
    'No recent visits yet.': 'Hakuna ziara za hivi karibuni bado.',
    'Total Revenue': 'Mapato Yote',
    'Total Orders': 'Oda Zote',
    'Total Customers': 'Wateja Wote',
    'Total Products': 'Bidhaa Zote',
    'Orders Management': 'Usimamizi wa Oda',
    'Product Reviews': 'Maoni ya Bidhaa',
    'Communications': 'Mawasiliano',
    'Settings': 'Mipangilio',
    'Products': 'Bidhaa',
    'Orders': 'Oda',
    'Customers': 'Wateja',
    'Users': 'Watumiaji',
    'Search': 'Tafuta',
    'Send': 'Tuma',
    'Cancel': 'Ghairi',
    'Save': 'Hifadhi',
    'Loading...': 'Inapakia...',
    'No notifications yet': 'Hakuna arifa bado',
    'Notifications': 'Arifa',
    'Mark all read': 'Weka zote zimesomwa',
  },
  fr: {
    'Analytics Overview': 'Vue analytique',
    'Key performance metrics and trends': 'Indicateurs et tendances clés',
    'Live Visits': 'Visites en direct',
    'Real project page opens and link taps today': 'Ouvertures de pages et clics de liens aujourd hui',
    'Visits Today': 'Visites aujourd hui',
    'Unique Visitors': 'Visiteurs uniques',
    'Active Now': 'Actifs maintenant',
    'Link Taps Today': 'Clics de liens aujourd hui',
    'Top Pages Today': 'Pages principales aujourd hui',
    'Top Link Taps Today': 'Liens les plus cliqués aujourd hui',
    'Recent Visits': 'Visites récentes',
    'Refresh': 'Actualiser',
    'Auto Sync ON': 'Synchronisation auto activée',
    'Auto Sync OFF': 'Synchronisation auto désactivée',
    'Page': 'Page',
    'Device': 'Appareil',
    'Language': 'Langue',
    'Referrer': 'Référent',
    'Time': 'Heure',
    'No visits recorded today yet.': 'Aucune visite enregistrée aujourd hui.',
    'No link taps recorded today yet.': 'Aucun clic de lien enregistré aujourd hui.',
    'No recent visits yet.': 'Aucune visite récente.',
    'Total Revenue': 'Revenu total',
    'Total Orders': 'Commandes totales',
    'Total Customers': 'Clients totaux',
    'Total Products': 'Produits totaux',
    'Orders Management': 'Gestion des commandes',
    'Product Reviews': 'Avis produits',
    'Communications': 'Communications',
    'Settings': 'Paramètres',
    'Products': 'Produits',
    'Orders': 'Commandes',
    'Customers': 'Clients',
    'Users': 'Utilisateurs',
    'Search': 'Rechercher',
    'Send': 'Envoyer',
    'Cancel': 'Annuler',
    'Save': 'Enregistrer',
    'Loading...': 'Chargement...',
    'No notifications yet': 'Aucune notification',
    'Notifications': 'Notifications',
    'Mark all read': 'Tout marquer comme lu',
  },
  de: {
    'Analytics Overview': 'Analyseübersicht',
    'Key performance metrics and trends': 'Wichtige Leistungskennzahlen und Trends',
    'Live Visits': 'Live-Besuche',
    'Real project page opens and link taps today': 'Echte Seitenaufrufe und Link-Klicks heute',
    'Visits Today': 'Besuche heute',
    'Unique Visitors': 'Eindeutige Besucher',
    'Active Now': 'Jetzt aktiv',
    'Link Taps Today': 'Link-Klicks heute',
    'Top Pages Today': 'Top-Seiten heute',
    'Top Link Taps Today': 'Top-Link-Klicks heute',
    'Recent Visits': 'Aktuelle Besuche',
    'Refresh': 'Aktualisieren',
    'Auto Sync ON': 'Auto-Sync EIN',
    'Auto Sync OFF': 'Auto-Sync AUS',
    'Page': 'Seite',
    'Device': 'Gerät',
    'Language': 'Sprache',
    'Referrer': 'Verweis',
    'Time': 'Zeit',
    'No visits recorded today yet.': 'Heute wurden noch keine Besuche aufgezeichnet.',
    'No link taps recorded today yet.': 'Heute wurden noch keine Link-Klicks aufgezeichnet.',
    'No recent visits yet.': 'Noch keine aktuellen Besuche.',
    'Total Revenue': 'Gesamtumsatz',
    'Total Orders': 'Gesamtbestellungen',
    'Total Customers': 'Gesamtkunden',
    'Total Products': 'Gesamtprodukte',
    'Orders Management': 'Bestellverwaltung',
    'Product Reviews': 'Produktbewertungen',
    'Communications': 'Kommunikation',
    'Settings': 'Einstellungen',
    'Products': 'Produkte',
    'Orders': 'Bestellungen',
    'Customers': 'Kunden',
    'Users': 'Benutzer',
    'Search': 'Suchen',
    'Send': 'Senden',
    'Cancel': 'Abbrechen',
    'Save': 'Speichern',
    'Loading...': 'Wird geladen...',
    'No notifications yet': 'Noch keine Benachrichtigungen',
    'Notifications': 'Benachrichtigungen',
    'Mark all read': 'Alle als gelesen markieren',
  },
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

export const translateLiteral = (value: string, locale?: LocaleCode | null) => {
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized) return value
  const resolved = resolveLocale(locale)
  if (resolved === FALLBACK_LOCALE) return value

  for (const [key, englishValue] of Object.entries(DICTS[FALLBACK_LOCALE])) {
    if (englishValue === normalized) {
      return DICTS[resolved][key] || COMMON_LITERALS[resolved][normalized] || value
    }
  }

  return COMMON_LITERALS[resolved][normalized] || value
}

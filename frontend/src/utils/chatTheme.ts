import type { ThemeMode } from '../contexts/ThemeContext'

export interface ChatPalette {
  mode: ThemeMode
  bg: string
  wallpaper: string
  sidebar: string
  list: string
  hover: string
  selected: string
  panel: string
  raised: string
  inputField: string
  sent: string
  received: string
  sentText: string
  receivedText: string
  text: string
  textSec: string
  accent: string
  accentText: string
  badge: string
  badgeText: string
  border: string
  check: string
  star: string
}

const darkPalette: ChatPalette = {
  mode: 'dark',
  bg: '#0b141a',
  wallpaper: 'rgba(233,237,239,0.05)',
  sidebar: '#202c33',
  list: '#111b21',
  hover: '#202c33',
  selected: '#2a3942',
  panel: '#202c33',
  raised: '#3b4a54',
  inputField: '#2a3942',
  sent: '#005c46',
  received: '#202c33',
  sentText: '#e9edef',
  receivedText: '#e9edef',
  text: '#e9edef',
  textSec: '#8696a0',
  accent: '#00a884',
  accentText: '#111b21',
  badge: '#25d366',
  badgeText: '#111b21',
  border: '#222d34',
  check: '#53bdeb',
  star: '#f5b92e',
}

const lightPalette: ChatPalette = {
  mode: 'light',
  bg: '#efeae2',
  wallpaper: 'rgba(17,27,33,0.06)',
  sidebar: '#f0f2f5',
  list: '#ffffff',
  hover: '#f5f6f6',
  selected: '#f0f2f5',
  panel: '#f0f2f5',
  raised: '#e9edef',
  inputField: '#ffffff',
  sent: '#d9fdd3',
  received: '#ffffff',
  sentText: '#111b21',
  receivedText: '#111b21',
  text: '#111b21',
  textSec: '#667781',
  accent: '#008069',
  accentText: '#ffffff',
  badge: '#25d366',
  badgeText: '#111b21',
  border: '#d1d7db',
  check: '#53bdeb',
  star: '#f5b92e',
}

export const getChatPalette = (mode: ThemeMode): ChatPalette => {
  const base = mode === 'dark' ? darkPalette : lightPalette
  const primary = readSiteVar('--site-primary')
  if (!primary) return base

  const accent = readSiteVar('--site-accent')
  const lightTint = readSiteVar('--site-red-100')
  const sent = mode === 'dark' ? primary : lightTint || base.sent
  const sentText = mode === 'dark' ? (isBrightColor(primary) ? '#111b21' : '#e9edef') : base.sentText
  const badge = accent || primary

  return {
    ...base,
    sent,
    sentText,
    accent: primary,
    accentText: isBrightColor(primary) ? '#111b21' : '#ffffff',
    badge,
    badgeText: isBrightColor(badge) ? '#111b21' : '#ffffff',
  }
}

const readSiteVar = (name: string): string | null => {
  if (typeof window === 'undefined') return null
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || null
}

const isBrightColor = (color: string): boolean => {
  const match = /^#?([a-f\d]{6})$/i.exec(color.trim())
  if (!match) return false
  const r = parseInt(match[1].slice(0, 2), 16)
  const g = parseInt(match[1].slice(2, 4), 16)
  const b = parseInt(match[1].slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
}

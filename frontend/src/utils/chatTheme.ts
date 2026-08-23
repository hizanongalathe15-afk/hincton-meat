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

export const getChatPalette = (mode: ThemeMode): ChatPalette =>
  mode === 'dark' ? darkPalette : lightPalette

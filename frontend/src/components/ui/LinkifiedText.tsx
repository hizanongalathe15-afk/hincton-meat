import type { ReactNode } from 'react'

const urlPattern = /((?:https?:\/\/|www\.)[^\s<]+|[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s<]*)?)/gi

const trimTrailingPunctuation = (value: string) => {
  const match = value.match(/[),.!?;:]+$/)
  if (!match) return { link: value, trailing: '' }
  return {
    link: value.slice(0, -match[0].length),
    trailing: match[0],
  }
}

const isLikelyUrl = (value: string) => {
  if (value.includes('@')) return false
  return /^(https?:\/\/|www\.)/i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}/i.test(value)
}

type LinkifiedTextProps = {
  text?: string | null
  className?: string
}

const LinkifiedText = ({ text, className }: LinkifiedTextProps) => {
  const value = text || ''
  const parts: ReactNode[] = []
  let lastIndex = 0

  for (const match of value.matchAll(urlPattern)) {
    const raw = match[0]
    const index = match.index ?? 0

    if (!isLikelyUrl(raw)) continue
    if (index > lastIndex) parts.push(value.slice(lastIndex, index))

    const { link, trailing } = trimTrailingPunctuation(raw)
    const href = /^https?:\/\//i.test(link) ? link : `https://${link}`

    parts.push(
      <a key={`${href}-${index}`} href={href} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
        {link}
      </a>
    )
    if (trailing) parts.push(trailing)
    lastIndex = index + raw.length
  }

  if (lastIndex < value.length) parts.push(value.slice(lastIndex))

  return <span className={className}>{parts}</span>
}

export default LinkifiedText

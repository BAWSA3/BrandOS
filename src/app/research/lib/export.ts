import { Interview } from '../types'
import { ADAPTIVE_QUESTIONS, TRACK_META, getQuestionsForProfile } from './data'
import { storage } from './storage'
import { TrackKey } from '../types'

function download(filename: string, type: string, content: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportInterviewText(iv: Interview): void {
  const profile = iv.profile
  const date = new Date(iv.date).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const questions = profile ? getQuestionsForProfile(profile) : []

  let out = `BRANDOS CREATOR RESEARCH\n${'─'.repeat(42)}\n\n`
  out += `CREATOR: @${iv.username}\n`
  out += `TIER:    ${iv.tier || 'Not set'}\n`
  out += `DATE:    ${date}\n`
  out += `PROFILE: ${profile || 'Unknown'}\n\n`
  out += `${'═'.repeat(42)}\nRESPONSES\n${'═'.repeat(42)}\n\n`

  const byTrack = questions.reduce((acc, q) => {
    if (!acc[q.track]) acc[q.track] = []
    acc[q.track].push(q)
    return acc
  }, {} as Record<string, typeof questions>)

  Object.entries(byTrack).forEach(([tk, qs]) => {
    out += `[ ${TRACK_META[tk as TrackKey]?.label?.toUpperCase()} ]\n\n`
    qs.forEach((q, i) => {
      out += `Q${i + 1}: ${q.text}\n`
      out += `A:  ${iv.responses?.[q.id] || 'No response recorded.'}\n\n`
    })
  })

  if (iv.summary) {
    const s = iv.summary
    out += `${'═'.repeat(42)}\nAI SUMMARY\n${'═'.repeat(42)}\n\n`
    out += `HEADLINE\n${s.headline}\n\n`
    out += `PROFILE SUMMARY\n${s.profileSummary}\n\n`
    out += `PAIN POINTS\n${s.painPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`
    out += `BRANDOS SIGNALS\n${s.brandOSSignals.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`
    out += `KEY INSIGHTS\n${s.keyInsights.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`
    out += `FOLLOW-UP\n${s.followUp}\n`
  }

  const dateSlug = new Date().toISOString().slice(0, 10)
  download(`BrandOS_@${iv.username}_${dateSlug}.txt`, 'text/plain', out)
}

export function exportAllCSV(): void {
  const idx = storage.getIndex()

  const headers = [
    'Username', 'Tier', 'Date', 'Profile', 'Status',
    ...ADAPTIVE_QUESTIONS.map(q => q.text),
    'Summary Headline', 'Pain Points', 'BrandOS Signals', 'Key Insights', 'Follow Up',
  ]

  const rows = idx.map(meta => {
    const iv = storage.getInterview(meta.id)
    if (!iv) return null
    const date = new Date(iv.date).toLocaleDateString()
    const qAnswers = ADAPTIVE_QUESTIONS.map(q =>
      (iv.responses?.[q.id] ?? '').replace(/"/g, '""')
    )
    const s = iv.summary
    return [
      `@${iv.username}`,
      iv.tier ?? '',
      date,
      iv.profile ?? '',
      iv.status,
      ...qAnswers,
      s?.headline?.replace(/"/g, '""') ?? '',
      s?.painPoints?.join(' | ').replace(/"/g, '""') ?? '',
      s?.brandOSSignals?.join(' | ').replace(/"/g, '""') ?? '',
      s?.keyInsights?.join(' | ').replace(/"/g, '""') ?? '',
      s?.followUp?.replace(/"/g, '""') ?? '',
    ]
  }).filter(Boolean) as string[][]

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  const dateSlug = new Date().toISOString().slice(0, 10)
  download(`BrandOS_Research_${dateSlug}.csv`, 'text/csv', csv)
}

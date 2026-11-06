/**
 * Language detection utility.
 * Uses Unicode block analysis for regional scripts + heuristics for English.
 * Does NOT require an external API.
 */

export type SupportedLanguage =
  | 'English'
  | 'Kannada'
  | 'Hindi'
  | 'Tamil'
  | 'Telugu'
  | 'Malayalam'
  | 'Mixed'
  | 'Unknown'

interface ScriptRange {
  name: SupportedLanguage
  start: number
  end: number
}

const SCRIPT_RANGES: ScriptRange[] = [
  { name: 'Kannada',   start: 0x0C80, end: 0x0CFF },
  { name: 'Tamil',     start: 0x0B80, end: 0x0BFF },
  { name: 'Telugu',    start: 0x0C00, end: 0x0C7F },
  { name: 'Malayalam', start: 0x0D00, end: 0x0D7F },
  { name: 'Hindi',     start: 0x0900, end: 0x097F }, // Devanagari
]

export function detectLanguage(text: string): SupportedLanguage {
  const counts: Record<string, number> = {}
  let totalNonAscii = 0
  let totalChars = text.replace(/\s+/g, '').length

  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0
    if (cp > 127) totalNonAscii++
    for (const { name, start, end } of SCRIPT_RANGES) {
      if (cp >= start && cp <= end) {
        counts[name] = (counts[name] || 0) + 1
      }
    }
  }

  // Find dominant non-ASCII script
  let dominant: SupportedLanguage | null = null
  let maxCount = 0
  for (const [lang, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count
      dominant = lang as SupportedLanguage
    }
  }

  // If significant non-ASCII AND English chars present -> Mixed
  const asciiAlpha = (text.match(/[a-zA-Z]/g) || []).length
  if (dominant && asciiAlpha > 5 && maxCount > 3) return 'Mixed'
  if (dominant) return dominant

  // If mostly ASCII letters, assume English
  if (asciiAlpha / Math.max(totalChars, 1) > 0.5) return 'English'

  return 'Unknown'
}

export function getProcessingLanguage(detected: SupportedLanguage, preferred: string): string {
  // For non-English inputs we'll instruct the AI to process and respond in that language
  if (detected === 'Unknown' || detected === 'Mixed') return preferred || 'English'
  return detected
}

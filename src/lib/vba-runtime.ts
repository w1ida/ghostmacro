/**
 * VBA runtime helpers — pure functions mirroring VBA semantics where
 * they differ from plain JS. Used by generated code (see transpiler.ts).
 * Week 2, task 2.7: vbaSum/vbaAverage/vbaCount/vbaLen/vbaUCase/vbaTrim
 * plus vbaFormat, string helpers (LCase/Left/Right/Mid/Replace),
 * vbaRound (VBA banker's rounding) and vbaMax/vbaMin.
 * Tests: src/lib/vba-runtime.test.ts (unit + fast-check properties).
 */

export function vbaSum(values: (number | null | undefined)[]): number {
  return values.reduce<number>((acc, v) => acc + (typeof v === 'number' && Number.isFinite(v) ? v : 0), 0)
}

export function vbaAverage(values: (number | null | undefined)[]): number {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  if (nums.length === 0) return 0
  return vbaSum(nums) / nums.length
}

export function vbaCount(values: unknown[]): number {
  return values.filter((v) => v !== null && v !== undefined && v !== '').length
}

export function vbaLen(value: string | null | undefined): number {
  return value == null ? 0 : String(value).length
}

export function vbaUCase(value: string | null | undefined): string {
  return value == null ? '' : String(value).toUpperCase()
}

export function vbaTrim(value: string | null | undefined): string {
  return value == null ? '' : String(value).trim()
}

export function vbaLCase(value: string | null | undefined): string {
  return value == null ? '' : String(value).toLowerCase()
}

/** VBA Left: first n chars; n <= 0 gives '', n past the end gives the whole string. */
export function vbaLeft(value: string | null | undefined, length: number): string {
  const s = value == null ? '' : String(value)
  if (length <= 0) return ''
  return s.slice(0, length)
}

/** VBA Right: last n chars; n <= 0 gives '', n past the end gives the whole string. */
export function vbaRight(value: string | null | undefined, length: number): string {
  const s = value == null ? '' : String(value)
  if (length <= 0) return ''
  return s.slice(-length)
}

/**
 * VBA Mid: 1-based. Mid("hello", 2, 3) === "ell". Start < 1 is clamped to 1;
 * length omitted (or past the end) runs to the end of the string.
 */
export function vbaMid(value: string | null | undefined, start: number, length?: number): string {
  const s = value == null ? '' : String(value)
  const from = Math.max(0, Math.floor(start) - 1)
  if (from >= s.length) return ''
  return length == null ? s.slice(from) : s.slice(from, from + Math.max(0, Math.floor(length)))
}

/** VBA Replace: every occurrence of `find` replaced (plain string, not regex). */
export function vbaReplace(value: string | null | undefined, find: string, replacement: string): string {
  const s = value == null ? '' : String(value)
  if (find === '') return s
  return s.split(find).join(replacement)
}

/**
 * VBA Round: banker's rounding (round-half-to-even), unlike Math.round.
 * Round(2.5) === 2, Round(3.5) === 4, Round(-2.5) === -2.
 */
export function vbaRound(value: number, decimals = 0): number {
  if (!Number.isFinite(value)) return value
  const factor = 10 ** decimals
  const scaled = value * factor
  const floor = Math.floor(scaled)
  const diff = scaled - floor
  // Binary floats rarely hold a decimal .5 exactly (1.225 * 100 is
  // 122.50000000000001), so treat a diff within epsilon of .5 as a tie.
  const epsilon = 1e-9
  let rounded: number
  if (diff > 0.5 + epsilon) rounded = floor + 1
  else if (diff < 0.5 - epsilon) rounded = floor
  else rounded = floor % 2 === 0 ? floor : floor + 1 // exactly .5 → nearest even
  return rounded / factor
}

export function vbaMax(values: (number | null | undefined)[]): number {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  return nums.length === 0 ? 0 : Math.max(...nums)
}

export function vbaMin(values: (number | null | undefined)[]): number {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  return nums.length === 0 ? 0 : Math.min(...nums)
}

/**
 * VBA Format, supported-subset only: "Currency"/"$#,##0.00" → $1,234.56,
 * "Percent"/"0.0%" → 12.3%, "0.00"/"0.0"/"0" → fixed decimals.
 * Anything else falls back to String(value) — never throws.
 */
export function vbaFormat(value: number | string | null | undefined, format?: string): string {
  if (value == null) return ''
  const num = typeof value === 'number' ? value : Number(value)
  const fmt = (format ?? '').trim()
  if (!Number.isFinite(num)) return String(value)
  if (fmt === '') return String(value)
  if (/%/.test(fmt)) {
    const decimals = (fmt.match(/0\.(0+)/)?.[1].length ?? 0)
    return `${(num * 100).toFixed(decimals)}%`
  }
  if (/currency/i.test(fmt) || fmt.includes('$')) {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  const fixed = fmt.match(/^0\.(0+)$/)
  if (fixed) return num.toFixed(fixed[1].length)
  if (fmt === '0') return String(Math.round(num))
  return String(value)
}

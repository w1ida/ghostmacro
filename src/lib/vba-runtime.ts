/**
 * VBA runtime helpers — pure functions mirroring VBA semantics where
 * they differ from plain JS. Used by generated code (see transpiler.ts).
 * TODO (Week 2, tasks 2.7): add vbaFormat, more string helpers, and
 * fast-check property tests for each helper.
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

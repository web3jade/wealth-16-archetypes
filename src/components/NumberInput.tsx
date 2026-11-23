import { useEffect, useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: number
  onChange: (value: number) => void
}

/**
 * Number field that keeps an empty draft while deleting —
 * does not coerce "" → 0 (which caused stuck leading zeros like 029).
 */
export function NumberInput({ value, onChange, min, max, onBlur, onFocus, ...rest }: Props) {
  const [draft, setDraft] = useState(() => formatDraft(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(formatDraft(value))
  }, [value, focused])

  return (
    <input
      {...rest}
      type="number"
      min={min}
      max={max}
      value={draft}
      onFocus={(e) => {
        setFocused(true)
        onFocus?.(e)
      }}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)
        // Empty stays empty (NaN) — never coerce "" → 0
        if (raw.trim() === '') {
          onChange(Number.NaN)
          return
        }
        const n = Number(raw)
        if (!Number.isFinite(n)) return
        onChange(n)
      }}
      onBlur={(e) => {
        setFocused(false)
        const raw = draft.trim()
        if (raw === '' || !Number.isFinite(Number(raw))) {
          onChange(Number.NaN)
          setDraft('')
        } else {
          const n = clamp(Number(raw), min, max)
          onChange(n)
          setDraft(formatDraft(n))
        }
        onBlur?.(e)
      }}
    />
  )
}

function formatDraft(n: number): string {
  return Number.isFinite(n) ? String(n) : ''
}

function clamp(n: number, min?: string | number, max?: string | number): number {
  let out = n
  if (min !== undefined && min !== '' && Number.isFinite(Number(min))) {
    out = Math.max(Number(min), out)
  }
  if (max !== undefined && max !== '' && Number.isFinite(Number(max))) {
    out = Math.min(Number(max), out)
  }
  return out
}

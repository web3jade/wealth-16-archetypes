import { useId, useState } from 'react'

interface Props {
  label: string
  hint: string
}

export function HintLabel({ label, hint }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)

  return (
    <span className={`hint-label ${open ? 'is-open' : ''}`}>
      <span>{label}</span>
      <button
        type="button"
        className="hint-dot"
        aria-label={hint}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        title={hint}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <span id={id} className="hint-popover" role="tooltip">
          {hint}
        </span>
      )}
    </span>
  )
}

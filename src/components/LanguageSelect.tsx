import { useEffect, useRef, useState } from 'react'
import { LANG_OPTIONS, type Lang, t } from '../i18n/messages'

interface Props {
  lang: Lang
  onChange: (lang: Lang) => void
}

export function LanguageSelect({ lang, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const current = LANG_OPTIONS.find((o) => o.id === lang)?.label ?? 'EN'

  return (
    <div className="lang-select" ref={ref}>
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t(lang, 'lang.label')}
        onClick={() => setOpen((v) => !v)}
      >
        <GlobeIcon />
        <span>{current}</span>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={t(lang, 'lang.label')}>
          {LANG_OPTIONS.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                role="option"
                aria-selected={opt.id === lang}
                className={opt.id === lang ? 'selected' : ''}
                onClick={() => {
                  onChange(opt.id)
                  setOpen(false)
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

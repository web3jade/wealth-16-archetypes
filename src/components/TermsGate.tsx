import { useState } from 'react'
import { t, type Lang } from '../i18n/messages'

interface Props {
  lang: Lang
  onAccept: () => void
  onCancel: () => void
}

export function TermsGate({ lang, onAccept, onCancel }: Props) {
  const [checked, setChecked] = useState(false)

  return (
    <div className="terms-overlay" role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <div className="terms-panel">
        <h2 id="terms-title">{t(lang, 'terms.title')}</h2>
        <div className="terms-body">
          <p>{t(lang, 'terms.p1')}</p>
          <p>{t(lang, 'terms.p2')}</p>
          <p>{t(lang, 'terms.p3')}</p>
          <p>{t(lang, 'terms.p4')}</p>
          <p>{t(lang, 'terms.p5')}</p>
        </div>
        <label className="terms-check">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>{t(lang, 'terms.agree')}</span>
        </label>
        <div className="terms-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            {t(lang, 'terms.cancel')}
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!checked}
            onClick={onAccept}
          >
            {t(lang, 'terms.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}

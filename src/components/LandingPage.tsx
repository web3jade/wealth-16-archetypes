import { t, type Lang } from '../i18n/messages'
import { localizeArchetype } from '../personality/localize'
import { personalityArtUrl } from '../personality/art'
import type { TypeCode } from '../personality/archetypes'
import { LanguageSelect } from './LanguageSelect'
import './LandingPage.css'

/** Cast order from layout-spec.md */
export const LANDING_CAST: TypeCode[] = ['EVAP', 'ESMP', 'LVAF', 'LSAF', 'EVMP', 'LSAP']

const decor = (name: string) => `${import.meta.env.BASE_URL}decor/${name}`

interface Props {
  lang: Lang
  onLangChange: (lang: Lang) => void
  onStart: () => void
}

export function LandingPage({ lang, onLangChange, onStart }: Props) {
  const brand = t(lang, 'brand.title')
  const brandAccent = brand.includes('16') ? (
    <>
      {brand.split('16')[0]}
      <span>16</span>
      {brand.split('16').slice(1).join('16')}
    </>
  ) : (
    brand
  )

  return (
    <main className="wealth-page">
      {/* Background from layout-spec palette */}
      <div className="wealth-bg" aria-hidden="true" />
      <img className="wealth-bg-curves" src={decor('bg-curves.svg')} alt="" aria-hidden="true" />

      <div className="wealth-lang">
        <LanguageSelect lang={lang} onChange={onLangChange} />
      </div>

      {/* Copy stack — fixed vertical rhythm; one unit so lines never overlap */}
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="eyebrow-line" />
          {t(lang, 'landing.kicker')}
          <span className="eyebrow-line" />
        </p>

        <h1 className="main-title">{brandAccent}</h1>
        <p className="subtitle">{t(lang, 'brand.subtitle')}</p>

        <div className="cta-slot">
          <img className="sparkles" src={decor('sparkles.svg')} alt="" aria-hidden="true" />
          <button type="button" className="start-button" onClick={onStart}>
            {t(lang, 'landing.cta')}
            <span className="button-arrow" aria-hidden="true">
              ›
            </span>
          </button>
        </div>
      </div>

      {/* Decorative assets — real SVGs, not CSS fakes */}
      <img className="coin coin-left" src={decor('coin-left.svg')} alt="" aria-hidden="true" />
      <img className="coin coin-right" src={decor('coin-right.svg')} alt="" aria-hidden="true" />
      <img className="growth-arrow" src={decor('growth-arrow.svg')} alt="" aria-hidden="true" />

      <section className="character-section" aria-label={t(lang, 'landing.castLabel')}>
        <div className="character-grid">
          {LANDING_CAST.map((code, index) => {
            const archetype = localizeArchetype(code, lang)
            return (
              <div className={`character-card character-${index + 1}`} key={code}>
                <div className="character-image">
                  <img src={personalityArtUrl(code)} alt="" />
                </div>
                <div className="character-info">
                  <strong>{code}</strong>
                  <span>{archetype.title}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

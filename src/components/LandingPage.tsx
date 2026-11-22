import { t, type Lang } from '../i18n/messages'
import { localizeArchetype } from '../personality/localize'
import { personalityArtUrl } from '../personality/art'
import type { TypeCode } from '../personality/archetypes'
import { LanguageSelect } from './LanguageSelect'

/** Curated cast for the movie-poster landing lineup. */
export const LANDING_CAST: TypeCode[] = ['EVAP', 'ESMP', 'LVAF', 'LSAF', 'EVMP', 'LSAP']

interface Props {
  lang: Lang
  onLangChange: (lang: Lang) => void
  onStart: () => void
}

export function LandingPage({ lang, onLangChange, onStart }: Props) {
  return (
    <div className="landing">
      <div className="landing-sky" aria-hidden="true" />
      <header className="landing-top">
        <LanguageSelect lang={lang} onChange={onLangChange} />
      </header>

      <section className="landing-hero">
        <p className="landing-kicker">{t(lang, 'landing.kicker')}</p>
        <h1 className="landing-brand">{t(lang, 'brand.title')}</h1>
        <p className="landing-sub">{t(lang, 'brand.subtitle')}</p>
        <button type="button" className="btn primary landing-cta" onClick={onStart}>
          {t(lang, 'landing.cta')}
        </button>
      </section>

      <div className="poster-stage" aria-label={t(lang, 'landing.castLabel')}>
        <div className="poster-glow" aria-hidden="true" />
        <ul className="poster-cast">
          {LANDING_CAST.map((code, i) => {
            const archetype = localizeArchetype(code, lang)
            return (
              <li
                key={code}
                className={`poster-figure poster-figure-${i}`}
                style={{ ['--i' as string]: i }}
              >
                <img src={personalityArtUrl(code)} alt="" />
                <span className="poster-code">{code}</span>
                <span className="poster-name">{archetype.title}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

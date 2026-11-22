import { t, type Lang } from '../i18n/messages'
import { personalityArtUrl } from '../personality/art'
import type { PersonalityResult } from '../personality/classify'

interface Props {
  personality: PersonalityResult
  lang?: Lang
}

export function SocialCard({ personality, lang = 'en' }: Props) {
  const artSrc = personalityArtUrl(personality.code)

  return (
    <article className="social-card" data-testid="social-card">
      <div className="social-card-stage">
        <div className="social-card-halo" aria-hidden="true" />
        <div className="social-card-ring" aria-hidden="true" />
        <img
          className="social-card-hero"
          src={artSrc}
          alt={`${personality.code} — ${personality.archetype.title}`}
        />
      </div>
      <div className="social-card-copy">
        <div className="eyebrow">{t(lang, 'brand.title')}</div>
        <div className="code">{personality.code}</div>
        <h2 className="title">{personality.archetype.title}</h2>
        <p className="tagline">{personality.archetype.tagline}</p>
        <p className="blurb">{personality.archetype.blurb}</p>
        <p className="meta">
          <strong>{t(lang, 'card.strength')}</strong> {personality.archetype.strength}
          <span className="dot">·</span>
          <strong>{t(lang, 'card.blindSpot')}</strong> {personality.archetype.blindSpot}
        </p>
      </div>
    </article>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  trackShare,
  trackTypeRevealed,
  trackWizardStep,
} from '../analytics'
import { buildPlanAdvice } from '../engine/advice'
import {
  agesAreValid,
  MAX_RETIRE_AGE,
  MIN_WORKING_AGE,
  validateAges,
} from '../engine/ageLimits'
import { projectRetirement, formatMoney } from '../engine/projectRetirement'
import { getRiskBand } from '../engine/riskBands'
import type {
  AssumptionOverrides,
  LifeStage,
  LifestyleGoal,
  RiskBand,
  WizardInput,
} from '../engine/types'
import { marketDisclaimer, t, type Lang } from '../i18n/messages'
import { cityLabel, marketLabel, statutoryHint, statutoryLabel } from '../i18n/places'
import { citiesForSelect, getMarket, isOtherCity, marketsGroupedByRegion } from '../markets'
import { classifyPersonality } from '../personality/classify'
import { buildAgentBrief, copyAgentBrief } from '../share/buildAgentBrief'
import { shareToXWithCard } from '../share/buildSharePayload'
import { downloadSocialCardPng } from '../share/downloadCard'
import {
  clearState,
  defaultInput,
  moneyFieldsReady,
  normalizeInput,
} from '../state/storage'
import { HintLabel } from './HintLabel'
import { LanguageSelect } from './LanguageSelect'
import { NumberInput } from './NumberInput'
import { SocialCard } from './SocialCard'

interface WizardProps {
  initialLang?: Lang
  onLangChange?: (lang: Lang) => void
  onBackHome?: () => void
}

const STEP_KEYS = [
  'step.locale',
  'step.life',
  'step.money',
  'step.goals',
  'step.risk',
  'step.results',
] as const

const LIFE_STAGE_KEYS: { id: LifeStage; key: string }[] = [
  { id: 'early_career', key: 'life.early' },
  { id: 'mid_career', key: 'life.mid' },
  { id: 'pre_retiree', key: 'life.pre' },
  { id: 'near_retiree', key: 'life.near' },
]

const LIFESTYLE_KEYS: { id: LifestyleGoal; key: string }[] = [
  { id: 'lean', key: 'goals.lean' },
  { id: 'same', key: 'goals.same' },
  { id: 'upgrade', key: 'goals.upgrade' },
]

const RISK_KEYS: { id: RiskBand; key: string }[] = [
  { id: 'conservative', key: 'risk.steady' },
  { id: 'balanced', key: 'risk.balanced' },
  { id: 'growth', key: 'risk.venture' },
]

export function Wizard({ initialLang, onLangChange, onBackHome }: WizardProps = {}) {
  // Always start a fresh quiz when Wizard mounts (App clears storage before opening).
  const bootLang: Lang = initialLang ?? 'zh'
  const [step, setStep] = useState(0)
  const [input, setInput] = useState<WizardInput>(() => defaultInput())
  const [assumptions, setAssumptions] = useState<AssumptionOverrides>({})
  const [lang, setLang] = useState<Lang>(bootLang)
  const [toast, setToast] = useState<string | null>(null)

  const setLanguage = (next: Lang) => {
    setLang(next)
    onLangChange?.(next)
  }

  const marketGroups = marketsGroupedByRegion()
  const market = getMarket(input.marketId) ?? marketGroups[0]?.markets[0]!
  const normalized = useMemo(() => normalizeInput(input), [input])
  const moneyOk = moneyFieldsReady(input)
  const assumptionsOk =
    assumptions.inflation !== undefined
    && Number.isFinite(assumptions.inflation)
    && assumptions.realReturn !== undefined
    && Number.isFinite(assumptions.realReturn)

  useEffect(() => {
    if (!market.cities.some((c) => c.id === input.cityId)) {
      setInput((prev) => ({ ...prev, cityId: market.cities[0].id }))
    }
  }, [market, input.cityId])

  const projection = useMemo(
    () => projectRetirement(normalized, market, assumptions),
    [normalized, market, assumptions],
  )
  const personality = useMemo(
    () => classifyPersonality(normalized, market, projection, lang),
    [normalized, market, projection, lang],
  )
  const advice = useMemo(
    () => buildPlanAdvice(normalized, market, projection, assumptions),
    [normalized, market, projection, assumptions],
  )

  useEffect(() => {
    document.title = `${t(lang, 'brand.title')} — ${t(lang, 'brand.subtitle')}`
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang
  }, [lang])

  useEffect(() => {
    trackWizardStep(step, STEP_KEYS[step], lang)
  }, [step, lang])

  const revealedKey = useRef<string | null>(null)
  useEffect(() => {
    if (step !== STEP_KEYS.length - 1) return
    const key = `${personality.code}:${input.marketId}:${input.cityId}:${lang}`
    if (revealedKey.current === key) return
    revealedKey.current = key
    trackTypeRevealed(lang, normalized, personality, assumptions)
  }, [step, lang, normalized, personality, assumptions])

  const patch = (partial: Partial<WizardInput>) => setInput((prev) => ({ ...prev, ...partial }))

  const ageErrors = useMemo(
    () => validateAges(input.currentAge, input.retireAge),
    [input.currentAge, input.retireAge],
  )
  const agesOk = ageErrors.length === 0

  const goToStep = (s: number) => {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const next = () => {
    if (step === 0 && !assumptionsOk) return
    if (step === 1 && !agesAreValid(input.currentAge, input.retireAge)) return
    if (step === 2 && !moneyFieldsReady(input)) return
    goToStep(Math.min(step + 1, STEP_KEYS.length - 1))
  }

  const setAssumptionPct = (key: 'inflation' | 'realReturn', pct: number) => {
    setAssumptions((prev) => {
      if (!Number.isFinite(pct)) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: pct / 100 }
    })
  }
  const back = () => goToStep(Math.max(step - 1, 0))

  const onShareX = () => {
    // Must stay sync in the click handler — awaiting before window.open gets blocked.
    const result = shareToXWithCard(personality, lang)
    trackShare('x', lang, personality.code)
    if (result === 'intent_with_preview') {
      setToast(t(lang, 'toast.shareX.preview'))
    } else if (result === 'intent_with_download') {
      setToast(t(lang, 'toast.shareX.attach'))
    } else {
      setToast(t(lang, 'toast.shared'))
    }
    setTimeout(() => setToast(null), 2800)
  }

  const onCopySiteLink = async () => {
    const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/([^:]\/)\/+/g, '$1')
    const url = base.endsWith('/') ? base : `${base}/`
    await navigator.clipboard.writeText(url)
    trackShare('site_copy', lang, personality.code)
    setToast(t(lang, 'toast.siteCopied'))
    setTimeout(() => setToast(null), 2200)
  }

  const onCopyForAgent = async () => {
    const brief = buildAgentBrief({
      lang,
      input: normalized,
      market,
      projection,
      advice,
      personality,
    })
    await copyAgentBrief(brief)
    trackShare('agent_copy', lang, personality.code)
    setToast(t(lang, 'toast.agentCopied'))
    setTimeout(() => setToast(null), 2200)
  }

  const onDownload = async () => {
    await downloadSocialCardPng(personality, lang)
    trackShare('download_png', lang, personality.code)
    setToast(t(lang, 'toast.downloaded'))
    setTimeout(() => setToast(null), 1800)
  }

  const reset = () => {
    clearState()
    setInput(defaultInput())
    setAssumptions({})
    setStep(0)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand">{t(lang, 'brand.title')}</div>
          <p className="brand-sub">{t(lang, 'brand.subtitle')}</p>
        </div>
        <div className="topbar-right">
          <div className="topbar-actions">
            {onBackHome && (
              <button type="button" className="btn ghost compact" onClick={onBackHome}>
                {t(lang, 'nav.home')}
              </button>
            )}
            <LanguageSelect lang={lang} onChange={setLanguage} />
          </div>
          <div className="step-pills" aria-label="Progress">
            {STEP_KEYS.map((key, i) => (
              <div
                key={key}
                className={`step-pill ${i === step ? 'active' : ''}`}
                title={t(lang, key)}
              />
            ))}
          </div>
        </div>
      </header>

      <section className="panel">
        {step === 0 && (
          <>
            <h1>{t(lang, 'locale.title')}</h1>
            <p className="lede">{t(lang, 'locale.lede')}</p>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="market">{t(lang, 'locale.market')}</label>
                <select
                  id="market"
                  value={input.marketId}
                  onChange={(e) => {
                    const nextMarket = getMarket(e.target.value) ?? market
                    patch({ marketId: nextMarket.id, cityId: nextMarket.cities[0].id })
                  }}
                >
                  {marketGroups.map((group) => (
                    <optgroup key={group.region} label={t(lang, `locale.region.${group.region}`)}>
                      {group.markets.map((m) => (
                        <option key={m.id} value={m.id}>
                          {marketLabel(lang, m.id, m.name)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="city">{t(lang, 'locale.city')}</label>
                <select
                  id="city"
                  value={isOtherCity(input.cityId) ? 'other-cities' : input.cityId}
                  onChange={(e) => patch({ cityId: e.target.value })}
                >
                  {citiesForSelect(market).map((c) => (
                    <option key={c.id} value={c.id}>
                      {cityLabel(lang, c.id, c.name)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="inflation">
                  <HintLabel
                    label={t(lang, 'locale.inflation')}
                    hint={t(lang, 'locale.inflation.hint')}
                  />
                </label>
                <NumberInput
                  id="inflation"
                  step="0.1"
                  min={-5}
                  max={50}
                  value={
                    assumptions.inflation === undefined
                      ? Number.NaN
                      : assumptions.inflation * 100
                  }
                  onChange={(pct) => setAssumptionPct('inflation', pct)}
                />
              </div>
              <div className="field">
                <label htmlFor="realReturn">
                  <HintLabel
                    label={t(lang, 'locale.return')}
                    hint={t(lang, 'locale.return.hint')}
                  />
                </label>
                <NumberInput
                  id="realReturn"
                  step="0.1"
                  min={-20}
                  max={50}
                  value={
                    assumptions.realReturn === undefined
                      ? Number.NaN
                      : assumptions.realReturn * 100
                  }
                  onChange={(pct) => setAssumptionPct('realReturn', pct)}
                />
              </div>
            </div>
            <p className="disclaimer">
              {marketDisclaimer(lang, market.id, market.disclaimer)}
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h1>{t(lang, 'life.title')}</h1>
            <p className="lede">{t(lang, 'life.lede')}</p>
            <div className="choice-row">
              {LIFE_STAGE_KEYS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`choice ${input.lifeStage === s.id ? 'selected' : ''}`}
                  onClick={() => patch({ lifeStage: s.id })}
                >
                  {t(lang, s.key)}
                </button>
              ))}
            </div>
            <div className="grid-2" style={{ marginTop: '1rem' }}>
              <div className={`field ${ageErrors.some((e) => e.startsWith('life.error.current')) ? 'has-error' : ''}`}>
                <label htmlFor="age">{t(lang, 'life.age')}</label>
                <NumberInput
                  id="age"
                  min={MIN_WORKING_AGE}
                  max={MAX_RETIRE_AGE - 1}
                  value={input.currentAge}
                  aria-invalid={ageErrors.some((e) => e.startsWith('life.error.current'))}
                  onChange={(currentAge) => patch({ currentAge })}
                />
              </div>
              <div className={`field ${ageErrors.some((e) => e.startsWith('life.error.retire')) ? 'has-error' : ''}`}>
                <label htmlFor="retireAge">{t(lang, 'life.retireAge')}</label>
                <NumberInput
                  id="retireAge"
                  min={Math.max(
                    MIN_WORKING_AGE + 1,
                    (Number.isFinite(input.currentAge) ? input.currentAge : MIN_WORKING_AGE) + 1,
                  )}
                  max={MAX_RETIRE_AGE}
                  value={input.retireAge}
                  aria-invalid={ageErrors.some((e) => e.startsWith('life.error.retire'))}
                  onChange={(retireAge) => patch({ retireAge })}
                />
              </div>
            </div>
            {!agesOk && (
              <ul className="field-errors" role="alert">
                {ageErrors.map((key) => (
                  <li key={key}>
                    {t(lang, key, { min: MIN_WORKING_AGE, max: MAX_RETIRE_AGE })}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h1>{t(lang, 'money.title')}</h1>
            <p className="lede">{t(lang, 'money.lede', { currency: market.currency })}</p>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="salary">{t(lang, 'money.salary')}</label>
                <NumberInput
                  id="salary"
                  min={0}
                  value={input.annualSalary}
                  onChange={(annualSalary) => patch({ annualSalary })}
                />
              </div>
              <div className="field">
                <label htmlFor="spend">{t(lang, 'money.spend')}</label>
                <NumberInput
                  id="spend"
                  min={0}
                  value={input.monthlySpend}
                  onChange={(monthlySpend) => patch({ monthlySpend })}
                />
              </div>
              <div className="field">
                <label htmlFor="savings">{t(lang, 'money.savings')}</label>
                <NumberInput
                  id="savings"
                  min={0}
                  value={input.currentSavings}
                  onChange={(currentSavings) => patch({ currentSavings })}
                />
              </div>
              <div className="field">
                <label htmlFor="statutory">
                  <HintLabel
                    label={t(lang, 'money.statutory', {
                      label: statutoryLabel(lang, market.id, market.statutory?.label),
                    })}
                    hint={statutoryHint(lang, market.id)}
                  />
                </label>
                <NumberInput
                  id="statutory"
                  min={0}
                  value={input.statutoryBalance}
                  onChange={(statutoryBalance) => patch({ statutoryBalance })}
                />
              </div>
              <div className="field">
                <label htmlFor="monthlySave">
                  <HintLabel
                    label={t(lang, 'money.monthlySave')}
                    hint={t(lang, 'money.monthlySave.hint')}
                  />
                </label>
                <NumberInput
                  id="monthlySave"
                  min={0}
                  value={input.monthlySavings}
                  onChange={(monthlySavings) => patch({ monthlySavings })}
                />
              </div>
              <div className="field">
                <label htmlFor="oneOff">
                  <HintLabel
                    label={t(lang, 'money.oneOff')}
                    hint={t(lang, 'money.oneOff.hint')}
                  />
                </label>
                <NumberInput
                  id="oneOff"
                  min={0}
                  value={input.oneOffGoals}
                  onChange={(oneOffGoals) => patch({ oneOffGoals })}
                />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1>{t(lang, 'goals.title')}</h1>
            <p className="lede">{t(lang, 'goals.lede')}</p>
            <div className="choice-row">
              {LIFESTYLE_KEYS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`choice ${input.lifestyleGoal === l.id ? 'selected' : ''}`}
                  onClick={() => patch({ lifestyleGoal: l.id })}
                >
                  {t(lang, l.key)}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1>{t(lang, 'risk.title')}</h1>
            <p className="lede">{t(lang, 'risk.lede')}</p>
            <div className="choice-row">
              {RISK_KEYS.map((r) => {
                const band = getRiskBand(r.id)
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`choice ${input.riskBand === r.id ? 'selected' : ''}`}
                    onClick={() => patch({ riskBand: r.id })}
                  >
                    {t(lang, 'risk.real', {
                      label: t(lang, r.key),
                      pct: (band.expectedRealReturn * 100).toFixed(0),
                    })}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1>{t(lang, 'results.title')}</h1>
            <p className="lede">{t(lang, 'results.lede')}</p>

            <SocialCard personality={personality} lang={lang} />

            <div className="share-actions">
              <button type="button" className="btn primary" onClick={onShareX}>
                {t(lang, 'results.shareX')}
              </button>
              <button type="button" className="btn ghost" onClick={onCopySiteLink}>
                {t(lang, 'results.shareSite')}
              </button>
              <button type="button" className="btn ghost" onClick={onCopyForAgent}>
                {t(lang, 'results.shareAgent')}
              </button>
              <button type="button" className="btn ghost" onClick={onDownload}>
                {t(lang, 'results.download')}
              </button>
            </div>

            <div className="tips-panel letters-panel">
              <h2>{t(lang, 'results.letters')}</h2>
              <p className="lede">{t(lang, 'results.letters.lede')}</p>
              <div className="letter-grid">
                {(
                  [
                    {
                      dim: 'horizon',
                      options: ['E', 'L'] as const,
                      active: personality.letters.horizon,
                    },
                    {
                      dim: 'risk',
                      options: ['S', 'V'] as const,
                      active: personality.letters.risk,
                    },
                    {
                      dim: 'lifestyle',
                      options: ['M', 'A'] as const,
                      active: personality.letters.lifestyle,
                    },
                    {
                      dim: 'style',
                      options: ['P', 'F'] as const,
                      active: personality.letters.style,
                    },
                  ] as const
                ).map((row) => (
                  <div key={row.dim} className="letter-dim">
                    <div className="letter-dim-title">{t(lang, `results.letters.${row.dim}`)}</div>
                    <ul className="letter-opts">
                      {row.options.map((letter) => (
                        <li
                          key={letter}
                          className={letter === row.active ? 'is-active' : undefined}
                        >
                          {t(lang, `results.letters.${row.dim}.${letter}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats" aria-label="Private plan numbers">
              <div className="stat">
                <div className="label">
                  <HintLabel
                    label={t(lang, 'results.projected')}
                    hint={t(lang, 'results.projected.hint')}
                  />
                </div>
                <div className="value">
                  {formatMoney(projection.projectedNestEggNominal, market.currencySymbol, true)}
                </div>
              </div>
              <div className="stat">
                <div className="label">
                  <HintLabel
                    label={t(lang, 'results.required')}
                    hint={t(lang, 'results.required.hint')}
                  />
                </div>
                <div className="value">
                  {formatMoney(projection.requiredNestEgg, market.currencySymbol, true)}
                </div>
              </div>
              <div className="stat">
                <div className="label">
                  {projection.gap > 0 ? (
                    <HintLabel
                      label={t(lang, 'results.extra')}
                      hint={t(lang, 'results.extra.hint')}
                    />
                  ) : (
                    <HintLabel
                      label={t(lang, 'results.surplus')}
                      hint={t(lang, 'results.surplus.hint')}
                    />
                  )}
                </div>
                <div className="value">
                  {projection.gap > 0
                    ? formatMoney(projection.extraMonthlySavingsNeeded, market.currencySymbol)
                    : formatMoney(projection.surplus, market.currencySymbol, true)}
                </div>
              </div>
            </div>

            <div className="tips-panel">
              <h2>{t(lang, 'results.tips')}</h2>
              <p className="lede">{t(lang, 'results.tips.lede')}</p>
              <ul className="tips-list">
                {advice.alreadyFundedNow ? (
                  <>
                    <li>
                      {t(lang, 'results.tips.alreadyFunded', {
                        age: input.currentAge,
                        target: input.retireAge,
                      })}
                    </li>
                    <li>{t(lang, 'results.tips.alreadyFunded.plan', { target: input.retireAge })}</li>
                  </>
                ) : (
                  <>
                    <li>
                      {Math.abs(advice.monthlySaveDelta) < 1
                        ? t(lang, 'results.tips.saveOk', { age: input.retireAge })
                        : advice.monthlySaveDelta > 0
                          ? t(lang, 'results.tips.saveMore', {
                              age: input.retireAge,
                              amount: formatMoney(advice.monthlySaveDelta, market.currencySymbol),
                            })
                          : t(lang, 'results.tips.saveLess', {
                              age: input.retireAge,
                              amount: formatMoney(
                                Math.abs(advice.monthlySaveDelta),
                                market.currencySymbol,
                              ),
                            })}
                    </li>
                    <li>
                      {advice.breakEvenRetireAge == null
                        ? t(lang, 'results.tips.ageNever')
                        : advice.breakEvenRetireAge > input.retireAge
                          ? t(lang, 'results.tips.ageLater', {
                              age: advice.breakEvenRetireAge,
                            })
                          : advice.breakEvenRetireAge < input.retireAge
                            ? t(lang, 'results.tips.ageEarlier', {
                                age: advice.breakEvenRetireAge,
                              })
                            : t(lang, 'results.tips.saveOk', { age: input.retireAge })}
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="tips-panel">
              <h2>{t(lang, 'results.portfolio')}</h2>
              <p className="lede">{t(lang, 'results.portfolio.lede')}</p>
              <p className="portfolio-return">
                {t(lang, 'results.portfolio.return', {
                  pct: (advice.portfolio.expectedRealReturn * 100).toFixed(1),
                })}
              </p>
              <div className="portfolio-bars">
                {advice.portfolio.slices
                  .filter((s) => s.pct > 0)
                  .map((slice) => (
                    <div key={slice.key} className="portfolio-row">
                      <div className="portfolio-meta">
                        <span>{t(lang, `results.portfolio.${slice.key}`)}</span>
                        <strong>{slice.pct}%</strong>
                      </div>
                      <div className="portfolio-track">
                        <div
                          className={`portfolio-fill portfolio-${slice.key}`}
                          style={{ width: `${slice.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <p className="disclaimer">
              {marketDisclaimer(lang, market.id, market.disclaimer)}{' '}
              {t(lang, 'results.disclaimerExtra')}
            </p>

            <button type="button" className="btn ghost block" style={{ marginTop: '1rem' }} onClick={reset}>
              {t(lang, 'results.restart')}
            </button>
          </>
        )}

        <div className="actions">
          <button type="button" className="btn ghost" onClick={back} disabled={step === 0}>
            {t(lang, 'nav.back')}
          </button>
          {step < 5 && (
            <button
              type="button"
              className="btn primary"
              onClick={next}
              disabled={
                (step === 0 && !assumptionsOk)
                || (step === 1 && !agesOk)
                || (step === 2 && !moneyOk)
              }
            >
              {t(lang, 'nav.continue')}
            </button>
          )}
        </div>
      </section>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

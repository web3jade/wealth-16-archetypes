import { useEffect, useMemo, useState } from 'react'
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
import { cityLabel, marketLabel } from '../i18n/places'
import { citiesForSelect, getMarket, isOtherCity, marketsGroupedByRegion } from '../markets'
import { classifyPersonality } from '../personality/classify'
import { buildAgentBrief, copyAgentBrief } from '../share/buildAgentBrief'
import { buildSharePayload, openShareToX } from '../share/buildSharePayload'
import { downloadSocialCardPng } from '../share/downloadCard'
import { clearState, defaultInput, loadState, saveState } from '../state/storage'
import { HintLabel } from './HintLabel'
import { LanguageSelect } from './LanguageSelect'
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
  const saved = loadState()
  const urlLang = new URLSearchParams(window.location.search).get('lang') as Lang | null
  const bootLang: Lang =
    initialLang ??
    (urlLang && ['en', 'zh', 'ja', 'ko'].includes(urlLang) ? urlLang : (saved?.lang ?? 'zh'))
  const [step, setStep] = useState(saved?.step ?? 0)
  const [input, setInput] = useState<WizardInput>(saved?.input ?? defaultInput())
  const [assumptions, setAssumptions] = useState<AssumptionOverrides>(saved?.assumptions ?? {})
  const [lang, setLang] = useState<Lang>(bootLang)
  const [toast, setToast] = useState<string | null>(null)

  const setLanguage = (next: Lang) => {
    setLang(next)
    onLangChange?.(next)
  }

  const marketGroups = marketsGroupedByRegion()
  const market = getMarket(input.marketId) ?? marketGroups[0]?.markets[0]!

  useEffect(() => {
    saveState({ step, input, assumptions, lang })
  }, [step, input, assumptions, lang])

  useEffect(() => {
    if (!market.cities.some((c) => c.id === input.cityId)) {
      setInput((prev) => ({ ...prev, cityId: market.cities[0].id }))
    }
  }, [market, input.cityId])

  const projection = useMemo(
    () => projectRetirement(input, market, assumptions),
    [input, market, assumptions],
  )
  const personality = useMemo(
    () => classifyPersonality(input, market, projection, lang),
    [input, market, projection, lang],
  )
  const advice = useMemo(
    () => buildPlanAdvice(input, market, projection, assumptions),
    [input, market, projection, assumptions],
  )

  useEffect(() => {
    document.title = `${t(lang, 'brand.title')} — ${t(lang, 'brand.subtitle')}`
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang
  }, [lang])

  const patch = (partial: Partial<WizardInput>) => setInput((prev) => ({ ...prev, ...partial }))

  const ageErrors = useMemo(
    () => validateAges(input.currentAge, input.retireAge),
    [input.currentAge, input.retireAge],
  )
  const agesOk = ageErrors.length === 0

  const next = () => {
    if (step === 1 && !agesAreValid(input.currentAge, input.retireAge)) return
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1))
  }
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const onShareX = () => {
    const payload = buildSharePayload(personality, lang)
    openShareToX(payload)
  }

  const onCopyForAgent = async () => {
    const brief = buildAgentBrief({
      lang,
      input,
      market,
      projection,
      advice,
      personality,
    })
    await copyAgentBrief(brief)
    setToast(t(lang, 'toast.agentCopied'))
    setTimeout(() => setToast(null), 2200)
  }

  const onDownload = async () => {
    await downloadSocialCardPng(personality, lang)
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
          {onBackHome && (
            <button type="button" className="btn ghost compact" onClick={onBackHome}>
              {t(lang, 'nav.home')}
            </button>
          )}
          <LanguageSelect lang={lang} onChange={setLanguage} />
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
                <input
                  id="age"
                  type="number"
                  min={MIN_WORKING_AGE}
                  max={MAX_RETIRE_AGE - 1}
                  value={input.currentAge}
                  aria-invalid={ageErrors.some((e) => e.startsWith('life.error.current'))}
                  onChange={(e) => patch({ currentAge: Number(e.target.value) })}
                />
              </div>
              <div className={`field ${ageErrors.some((e) => e.startsWith('life.error.retire')) ? 'has-error' : ''}`}>
                <label htmlFor="retireAge">{t(lang, 'life.retireAge')}</label>
                <input
                  id="retireAge"
                  type="number"
                  min={Math.max(MIN_WORKING_AGE + 1, input.currentAge + 1)}
                  max={MAX_RETIRE_AGE}
                  value={input.retireAge}
                  aria-invalid={ageErrors.some((e) => e.startsWith('life.error.retire'))}
                  onChange={(e) => patch({ retireAge: Number(e.target.value) })}
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
                <input
                  id="salary"
                  type="number"
                  min={0}
                  value={input.annualSalary}
                  onChange={(e) => patch({ annualSalary: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor="spend">{t(lang, 'money.spend')}</label>
                <input
                  id="spend"
                  type="number"
                  min={0}
                  value={input.monthlySpend}
                  onChange={(e) => patch({ monthlySpend: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor="savings">{t(lang, 'money.savings')}</label>
                <input
                  id="savings"
                  type="number"
                  min={0}
                  value={input.currentSavings}
                  onChange={(e) => patch({ currentSavings: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor="statutory">
                  {t(lang, 'money.statutory', {
                    label: market.statutory?.label ?? t(lang, 'money.retirementAccount'),
                  })}
                </label>
                <input
                  id="statutory"
                  type="number"
                  min={0}
                  value={input.statutoryBalance}
                  onChange={(e) => patch({ statutoryBalance: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor="monthlySave">
                  <HintLabel
                    label={t(lang, 'money.monthlySave')}
                    hint={t(lang, 'money.monthlySave.hint')}
                  />
                </label>
                <input
                  id="monthlySave"
                  type="number"
                  min={0}
                  value={input.monthlySavings}
                  onChange={(e) => patch({ monthlySavings: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor="oneOff">
                  <HintLabel
                    label={t(lang, 'money.oneOff')}
                    hint={t(lang, 'money.oneOff.hint')}
                  />
                </label>
                <input
                  id="oneOff"
                  type="number"
                  min={0}
                  value={input.oneOffGoals}
                  onChange={(e) => patch({ oneOffGoals: Number(e.target.value) })}
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
                          amount: formatMoney(Math.abs(advice.monthlySaveDelta), market.currencySymbol),
                        })}
                </li>
                {Math.abs(advice.monthlyEarnDelta) >= 1 && (
                  <li>
                    {advice.monthlyEarnDelta > 0
                      ? t(lang, 'results.tips.earnMore', {
                          amount: formatMoney(advice.monthlyEarnDelta, market.currencySymbol),
                        })
                      : t(lang, 'results.tips.earnLess', {
                          amount: formatMoney(Math.abs(advice.monthlyEarnDelta), market.currencySymbol),
                        })}
                  </li>
                )}
                <li>
                  {advice.breakEvenRetireAge == null
                    ? t(lang, 'results.tips.ageNever')
                    : advice.breakEvenRetireAge > input.retireAge
                      ? t(lang, 'results.tips.ageLater', { age: advice.breakEvenRetireAge })
                      : advice.breakEvenRetireAge < input.retireAge
                        ? t(lang, 'results.tips.ageEarlier', { age: advice.breakEvenRetireAge })
                        : t(lang, 'results.tips.saveOk', { age: input.retireAge })}
                </li>
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

            <div className="assumptions">
              <h2>{t(lang, 'results.assumptions')}</h2>
              <p className="lede">{t(lang, 'results.assumptionsLede')}</p>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="infl">{t(lang, 'results.inflation')}</label>
                  <input
                    id="infl"
                    type="number"
                    step="0.005"
                    value={assumptions.inflation ?? projection.inflation}
                    onChange={(e) =>
                      setAssumptions((a) => ({ ...a, inflation: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="ret">{t(lang, 'results.return')}</label>
                  <input
                    id="ret"
                    type="number"
                    step="0.005"
                    value={assumptions.realReturn ?? projection.realReturn}
                    onChange={(e) =>
                      setAssumptions((a) => ({ ...a, realReturn: Number(e.target.value) }))
                    }
                  />
                </div>
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

        {step < 5 && (
          <div className="actions">
            <button type="button" className="btn ghost" onClick={back} disabled={step === 0}>
              {t(lang, 'nav.back')}
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={next}
              disabled={step === 1 && !agesOk}
            >
              {t(lang, 'nav.continue')}
            </button>
          </div>
        )}
      </section>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

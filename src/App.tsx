import { useEffect, useState } from 'react'
import {
  trackCtaClick,
  trackLandingView,
  trackLangChange,
  trackTerms,
} from './analytics'
import { LandingPage } from './components/LandingPage'
import { TermsGate } from './components/TermsGate'
import { Wizard } from './components/Wizard'
import { t, type Lang } from './i18n/messages'
import {
  clearState,
  hasAcceptedTerms,
  loadLangPreference,
  saveLangPreference,
  saveTermsAccepted,
} from './state/storage'

type Screen = 'landing' | 'wizard'

function readEntryParams() {
  const params = new URLSearchParams(window.location.search)
  const urlLang = params.get('lang') as Lang | null
  const langOk = urlLang && ['en', 'zh', 'ja', 'ko'].includes(urlLang)
  // Shared links (?type=… or ?fresh=1) must never reopen a previous filled quiz.
  const freshStart = params.has('type') || params.get('fresh') === '1'
  return {
    lang: (langOk ? urlLang : null) as Lang | null,
    freshStart,
  }
}

function stripFreshParams() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('fresh') && !url.searchParams.has('type')) return
  url.searchParams.delete('fresh')
  url.searchParams.delete('type')
  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState({}, '', next)
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    const entry = readEntryParams()
    if (entry.freshStart) clearState()
    return entry.lang ?? loadLangPreference() ?? 'zh'
  })
  const [screen, setScreen] = useState<Screen>('landing')
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    // Never reopen a previously filled quiz after refresh / return to landing.
    clearState()
    stripFreshParams()
  }, [])

  useEffect(() => {
    saveLangPreference(lang)
    document.title = `${t(lang, 'brand.title')} — ${t(lang, 'brand.subtitle')}`
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang
  }, [lang])

  useEffect(() => {
    if (screen === 'landing') trackLandingView(lang)
  }, [screen, lang])

  const onLangChange = (next: Lang) => {
    setLang(next)
    trackLangChange(next)
  }

  const beginWizard = () => {
    clearState()
    setScreen('wizard')
  }

  const startFlow = () => {
    trackCtaClick(lang)
    if (hasAcceptedTerms()) {
      beginWizard()
      return
    }
    setShowTerms(true)
    trackTerms('shown', lang)
  }

  const acceptTerms = () => {
    saveTermsAccepted()
    trackTerms('accepted', lang)
    setShowTerms(false)
    beginWizard()
  }

  const cancelTerms = () => {
    trackTerms('cancelled', lang)
    setShowTerms(false)
  }

  if (screen === 'landing') {
    return (
      <>
        <LandingPage lang={lang} onLangChange={onLangChange} onStart={startFlow} />
        {showTerms && (
          <TermsGate lang={lang} onAccept={acceptTerms} onCancel={cancelTerms} />
        )}
      </>
    )
  }

  return (
    <Wizard
      initialLang={lang}
      onLangChange={onLangChange}
      onBackHome={() => setScreen('landing')}
    />
  )
}

import { useEffect, useState } from 'react'
import { LandingPage } from './components/LandingPage'
import { TermsGate } from './components/TermsGate'
import { Wizard } from './components/Wizard'
import { t, type Lang } from './i18n/messages'
import { hasAcceptedTerms, loadLangPreference, saveLangPreference, saveTermsAccepted } from './state/storage'

type Screen = 'landing' | 'wizard'

export default function App() {
  const urlLang = new URLSearchParams(window.location.search).get('lang') as Lang | null
  const initialLang: Lang =
    urlLang && ['en', 'zh', 'ja', 'ko'].includes(urlLang)
      ? urlLang
      : (loadLangPreference() ?? 'zh')

  const [lang, setLang] = useState<Lang>(initialLang)
  const [screen, setScreen] = useState<Screen>('landing')
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    saveLangPreference(lang)
    document.title = `${t(lang, 'brand.title')} — ${t(lang, 'brand.subtitle')}`
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang
  }, [lang])

  const startFlow = () => {
    if (hasAcceptedTerms()) {
      setScreen('wizard')
      return
    }
    setShowTerms(true)
  }

  const acceptTerms = () => {
    saveTermsAccepted()
    setShowTerms(false)
    setScreen('wizard')
  }

  if (screen === 'landing') {
    return (
      <>
        <LandingPage lang={lang} onLangChange={setLang} onStart={startFlow} />
        {showTerms && (
          <TermsGate lang={lang} onAccept={acceptTerms} onCancel={() => setShowTerms(false)} />
        )}
      </>
    )
  }

  return <Wizard initialLang={lang} onLangChange={setLang} onBackHome={() => setScreen('landing')} />
}

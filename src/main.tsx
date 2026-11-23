import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PostHogProvider } from '@posthog/react'
import App from './App'
import { getPosthogClient, initAnalytics } from './analytics'
import './styles.css'

initAnalytics()

const client = getPosthogClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {client ? (
      <PostHogProvider client={client}>
        <App />
      </PostHogProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)

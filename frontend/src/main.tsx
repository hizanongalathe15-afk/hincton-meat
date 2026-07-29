import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { CartProvider } from './contexts/CartContext.tsx'
import { WishlistProvider } from './contexts/WishlistContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { SiteThemeProvider } from './contexts/SiteThemeContext.tsx'
import { SiteContentProvider } from './contexts/SiteContentContext.tsx'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
import { CurrencyProvider, injectLdScript, setVoiceMeta, getOrAssignExperiment } from './utils/currencyAndSeo'
import { featuresApi } from './services/featuresApi'
import { QuickViewProvider } from './components/ecommerce/QuickViewModal'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined))
}

const queryClient = new QueryClient({

  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      cacheTime: 5 * 60_000,
      keepPreviousData: true,
    },
  },
})

const SESSION_KEY = 'hincton:ab-session'
const getSessionId = () => {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
  } catch {}
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`
  try { sessionStorage.setItem(SESSION_KEY, id) } catch {}
  return id
}

const initializeGlobalFeatures = async () => {
  try {
    setVoiceMeta(['fresh meat', 'beef', 'goat meat', 'chicken', 'nairobi butcher', 'kenya meat delivery'], 'Order premium fresh meat online for delivery across Kenya.')
  } catch {}
  try {
    const sessionId = getSessionId()
    const assigned = getOrAssignExperiment('homepage-hero-variant')
    await featuresApi.assignExperiment({ experimentKey: assigned.key, variant: assigned.variant, sessionId }).catch(() => {})
    const org = getOrAssignExperiment('checkout-org-variant')
    await featuresApi.assignExperiment({ experimentKey: org.key, variant: org.variant, sessionId }).catch(() => {})
    injectLdScript('ld-organization', {
      '@context': 'https://schema.org/',
      '@type': 'Organization',
      name: 'Hincton Meat Products',
      url: 'https://www.hinctonmeatproducts.com',
      logo: '/hincton/logo.png',
      sameAs: [
        'https://www.instagram.com/hinctonmeatproducts',
        'https://www.facebook.com/',
        'https://wa.me/254759901357',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+254759901357',
        contactType: 'customer service',
        areaServed: 'KE',
      },
    })
    // --- Web Vitals report hook ---
    if ('PerformanceObserver' in globalThis) {
      const reportCwv = (name: 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB' | 'FCP', value: number) => {
        let rating: 'good' | 'needs-improvement' | 'poor' = 'good'
        const thresholds: Record<string, [number, number]> = {
          LCP: [2500, 4000], CLS: [0.1, 0.25], FID: [100, 300], INP: [200, 500], TTFB: [800, 1800], FCP: [1800, 3000],
        }
        const [g, n] = thresholds[name] || [0, 0]
        if (g && value > g) rating = 'needs-improvement'
        if (n && value > n) rating = 'poor'
        featuresApi.reportCwv({ name, value, rating, path: window.location.pathname, sessionId }).catch(() => {})
      }
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const name = entry.entryType === 'largest-contentful-paint' ? 'LCP'
              : entry.entryType === 'first-input' ? 'FID'
              : entry.entryType === 'layout-shift' ? 'CLS'
              : entry.entryType === 'first-contentful-paint' ? 'FCP'
              : entry.name === 'interactive' ? 'INP' : 'TTFB'
            const value = 'value' in entry ? (entry as any).value : ('duration' in entry ? (entry as any).duration : 0)
            reportCwv(name as any, Number(value || 0))
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true })
      } catch {}
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            reportCwv('INP', Number(((entry as any).processingStart - (entry as any).startTime) || (entry as any).duration || 0))
          }
        }).observe({ type: 'first-input', buffered: true })
      } catch {}
      try {
        new PerformanceObserver((list) => {
          let cls = 0
          for (const entry of list.getEntries()) if (!(entry as any).hadRecentInput) cls += (entry as any).value || 0
          reportCwv('CLS', cls)
        }).observe({ type: 'layout-shift', buffered: true })
      } catch {}
    }
  } catch {}
}

initializeGlobalFeatures()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <SiteThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <SiteContentProvider>
                <CurrencyProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <QuickViewProvider>
                        <App />
                      </QuickViewProvider>
                    </WishlistProvider>
                  </CartProvider>
                </CurrencyProvider>
              </SiteContentProvider>
            </LanguageProvider>
          </AuthProvider>
          </SiteThemeProvider>
        </ThemeProvider>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
)

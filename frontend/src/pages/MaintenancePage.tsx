import { useEffect, useState } from 'react'

const MaintenancePage = () => {
  const [checked, setChecked] = useState(false)

  // Poll every 15s to check if maintenance mode is off
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/content/site-profile')
        if (res.ok) {
          const data = await res.json()
          const maintenanceOn = data?.profile?.featureToggles?.maintenanceMode
          if (!maintenanceOn) {
            clearInterval(interval)
            window.location.href = '/'
          }
        }
      } catch {
        // still under maintenance or network issue
      }
    }, 15_000)
    const timeout = setTimeout(() => setChecked(true), 2000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900 px-4 text-center text-white">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-700/20">
            <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75-6.75M4.5 12l6.75 6.75" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          We'll be right back
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-300">
          We're upgrading our systems to serve you better. Our site is temporarily unavailable while we make improvements.
        </p>
        <p className="mt-4 text-sm text-gray-400">
          Please check back in a few minutes. We appreciate your patience!
        </p>
        <div className="mt-10">
          <a
            href="/"
            className="inline-flex items-center rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            onClick={(e) => {
              e.preventDefault()
              window.location.href = '/'
            }}
          >
            Try Again
          </a>
        </div>
        {checked && (
          <p className="mt-6 text-xs text-gray-500">
            Still working on it — thank you for waiting.
          </p>
        )}
      </div>
    </div>
  )
}

export default MaintenancePage

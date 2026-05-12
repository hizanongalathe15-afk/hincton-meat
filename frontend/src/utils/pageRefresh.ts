// Page refresh utilities with proper cleanup and state management

interface RefreshOptions {
  force?: boolean
  preserveScroll?: boolean
  showNotification?: boolean
}

// Smart page refresh with state preservation
export const smartRefresh = (options: RefreshOptions = {}) => {
  const {
    force = false,
    preserveScroll = true,
    showNotification = true
  } = options

  // Save current scroll position
  const scrollPosition = preserveScroll ? window.scrollY : 0

  // Show notification if requested
  if (showNotification) {
    const notification = document.createElement('div')
    notification.className = 'fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse'
    notification.textContent = 'Refreshing page...'
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 2000)
  }

  // Store current state in sessionStorage
  if (preserveScroll) {
    sessionStorage.setItem('scrollPosition', scrollPosition.toString())
    sessionStorage.setItem('refreshTimestamp', Date.now().toString())
  }

  // Perform refresh
  if (force) {
    // Force refresh by bypassing cache
    window.location.href = window.location.href + '?refresh=' + Date.now()
  } else {
    window.location.reload()
  }
}

// Restore scroll position after refresh
export const restoreScrollPosition = () => {
  const scrollPosition = sessionStorage.getItem('scrollPosition')
  const refreshTimestamp = sessionStorage.getItem('refreshTimestamp')

  if (scrollPosition && refreshTimestamp) {
    const timeDiff = Date.now() - parseInt(refreshTimestamp)
    
    // Only restore if refresh was recent (within 5 seconds)
    if (timeDiff < 5000) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(scrollPosition))
      }, 100)
      
      // Clear stored data
      sessionStorage.removeItem('scrollPosition')
      sessionStorage.removeItem('refreshTimestamp')
    }
  }
}

// Auto-refresh with interval management
const refreshIntervals: Map<string, ReturnType<typeof setInterval>> = new Map()

export const startAutoRefresh = (key: string, interval: number, callback?: () => void) => {
  // Clear existing interval for this key
  stopAutoRefresh(key)

  const intervalId = setInterval(() => {
    if (callback) {
      callback()
    } else {
      smartRefresh({ showNotification: false })
    }
  }, interval)

  refreshIntervals.set(key, intervalId)
  return intervalId
}

export const stopAutoRefresh = (key: string) => {
  const intervalId = refreshIntervals.get(key)
  if (intervalId) {
    clearInterval(intervalId)
    refreshIntervals.delete(key)
  }
}

// Clear all auto-refresh intervals
export const clearAllAutoRefresh = () => {
  refreshIntervals.forEach((intervalId) => {
    clearInterval(intervalId)
  })
  refreshIntervals.clear()
}

// Page visibility change handler
export const handleVisibilityChange = (callback: (isVisible: boolean) => void) => {
  const handleVisibilityChange = () => {
    callback(!document.hidden)
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

// Network status monitoring
export const monitorNetworkStatus = (callback: (isOnline: boolean) => void) => {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Refresh on network reconnection
export const refreshOnReconnect = () => {
  const cleanupNetwork = monitorNetworkStatus((isOnline) => {
    if (isOnline) {
      // Network is back online, refresh if page was loaded while offline
      const wasOffline = sessionStorage.getItem('wasOffline')
      if (wasOffline === 'true') {
        smartRefresh({ showNotification: true })
        sessionStorage.removeItem('wasOffline')
      }
    } else {
      // Network is offline
      sessionStorage.setItem('wasOffline', 'true')
    }
  })

  return cleanupNetwork
}

// Refresh on focus (when user returns to tab)
export const refreshOnFocus = (options: RefreshOptions = {}) => {
  const cleanupVisibility = handleVisibilityChange((isVisible) => {
    if (isVisible) {
      const lastFocusTime = sessionStorage.getItem('lastFocusTime')
      const now = Date.now()
      
      // Only refresh if it's been more than 5 minutes since last focus
      if (!lastFocusTime || now - parseInt(lastFocusTime) > 5 * 60 * 1000) {
        smartRefresh({ ...options, showNotification: false })
      }
      
      sessionStorage.setItem('lastFocusTime', now.toString())
    }
  })

  return cleanupVisibility
}

// Error boundary refresh
export const refreshOnError = (errorCount = 3) => {
  let currentErrorCount = parseInt(sessionStorage.getItem('errorCount') || '0')
  
  currentErrorCount++
  sessionStorage.setItem('errorCount', currentErrorCount.toString())

  if (currentErrorCount >= errorCount) {
    // Too many errors, refresh the page
    smartRefresh({ force: true, showNotification: true })
    sessionStorage.removeItem('errorCount')
  }
}

// Clear error count on successful operation
export const clearErrorCount = () => {
  sessionStorage.removeItem('errorCount')
}

// Memory cleanup on page unload
export const setupCleanup = () => {
  window.addEventListener('beforeunload', () => {
    clearAllAutoRefresh()
    sessionStorage.removeItem('scrollPosition')
    sessionStorage.removeItem('refreshTimestamp')
    sessionStorage.removeItem('lastFocusTime')
  })
}

// Initialize all refresh utilities
export const initializeRefreshUtils = () => {
  // Restore scroll position on load
  restoreScrollPosition()
  
  // Setup cleanup on unload
  setupCleanup()
  
  // Setup network monitoring
  refreshOnReconnect()
  
  // Setup focus refresh
  refreshOnFocus()
}

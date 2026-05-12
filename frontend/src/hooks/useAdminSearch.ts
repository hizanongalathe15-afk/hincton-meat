import { useState, useCallback, useRef, useEffect } from 'react'
import { adminSearchService, SearchResult, SearchSuggestion } from '../services/adminSearchService'

export const useAdminSearch = () => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Load history on mount
  useEffect(() => {
    setHistory(adminSearchService.getSearchHistory())
  }, [])

  // Get suggestions as user types
  const handleQueryChange = useCallback(async (value: string) => {
    setQuery(value)
    
    if (value.length < 2) {
      setSuggestions([])
      setResults([])
      setIsOpen(value.length === 0)
      return
    }

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    setIsLoading(true)
    debounceTimer.current = setTimeout(async () => {
      const [sug, res] = await Promise.all([
        adminSearchService.getSearchSuggestions(value),
        adminSearchService.performSearch(value)
      ])
      setSuggestions(sug)
      setResults(res)
      setIsLoading(false)
      setIsOpen(true)
    }, 300)
  }, [])

  // Perform full search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) return
    
    setIsLoading(true)
    const res = await adminSearchService.performSearch(searchQuery)
    setResults(res)
    setQuery(searchQuery)
    setSuggestions([])
    setHistory(adminSearchService.getSearchHistory())
    setIsLoading(false)
  }, [])

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion)
    setSuggestions([])
    performSearch(suggestion)
    setIsOpen(false)
  }, [performSearch])

  // Apply history item
  const applyHistoryItem = useCallback((item: string) => {
    setQuery(item)
    setSuggestions([])
    performSearch(item)
    setIsOpen(false)
  }, [performSearch])

  // Clear history
  const clearHistory = useCallback(() => {
    adminSearchService.clearSearchHistory()
    setHistory([])
  }, [])

  // Remove from history
  const removeFromHistory = useCallback((item: string) => {
    adminSearchService.removeFromHistory(item)
    setHistory(adminSearchService.getSearchHistory())
  }, [])

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setResults([])
    setIsOpen(false)
  }, [])

  return {
    query,
    suggestions,
    results,
    history,
    isLoading,
    isOpen,
    setIsOpen,
    handleQueryChange,
    performSearch,
    applySuggestion,
    applyHistoryItem,
    clearHistory,
    removeFromHistory,
    clearSearch
  }
}

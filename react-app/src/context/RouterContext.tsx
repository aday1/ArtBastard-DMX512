import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ViewType = 'main' | 'fixture' | 'planner' | 'scenesActs' | 'misc' | 'state' | 'dmxControl' | 'experimental' | 'mobile'

interface RouterContextType {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  navigationHistory: ViewType[]
  goBack: () => void
  canGoBack: boolean
}

const RouterContext = createContext<RouterContextType | undefined>(undefined)

interface RouterProviderProps {
  children: ReactNode
}

const viewToHash: Record<ViewType, string> = {
  main: '#/main',
  fixture: '#/fixture',
  planner: '#/planner',
  scenesActs: '#/scenes-acts',
  misc: '#/settings',
  state: '#/state',
  dmxControl: '#/dmx-control',
  experimental: '#/experimental',
  mobile: '#/mobile'
}

const hashToView = (hashValue: string): ViewType | null => {
  const normalized = hashValue.replace(/^#/, '').replace(/^\//, '').toLowerCase()

  if (!normalized) return null

  switch (normalized) {
    case 'main':
      return 'main'
    case 'fixture':
      return 'fixture'
    case 'planner':
      return 'planner'
    case 'scenes-acts':
    case 'scenesacts':
      return 'scenesActs'
    case 'settings':
    case 'misc':
      return 'misc'
    case 'state':
      return 'state'
    case 'dmx-control':
    case 'dmxcontrol':
      return 'dmxControl'
    case 'experimental':
      return 'experimental'
    case 'mobile':
      return 'mobile'
    default:
      return null
  }
}

export const RouterProvider: React.FC<RouterProviderProps> = ({ children }) => {
  const initialHashView = hashToView(window.location.hash)
  const initialView: ViewType = initialHashView || 'dmxControl'
  const [currentView, setCurrentView] = useState<ViewType>(initialView)
  const [navigationHistory, setNavigationHistory] = useState<ViewType[]>([initialView])

  // Listen for navigation events from navbar
  useEffect(() => {
    const handleViewChange = (event: CustomEvent<{ view: ViewType }>) => {
      const newView = event.detail.view
      setCurrentView(newView)
      setNavigationHistory(prev => [...prev, newView])
    }

    window.addEventListener('changeView', handleViewChange as EventListener)
    return () => {
      window.removeEventListener('changeView', handleViewChange as EventListener)
    }
  }, [])

  // Listen for hash-based route changes
  useEffect(() => {
    const handleHashRouteChange = () => {
      const routeView = hashToView(window.location.hash)
      if (!routeView || routeView === currentView) return

      setCurrentView(routeView)
      setNavigationHistory(prev => [...prev, routeView])
    }

    window.addEventListener('hashchange', handleHashRouteChange)
    return () => {
      window.removeEventListener('hashchange', handleHashRouteChange)
    }
  }, [currentView])

  // Keep URL hash synchronized with current view
  useEffect(() => {
    const targetHash = viewToHash[currentView]
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash)
    }
  }, [currentView])

  const handleSetCurrentView = (view: ViewType) => {
    setCurrentView(view)
    setNavigationHistory(prev => [...prev, view])
  }

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = navigationHistory.slice(0, -1)
      const previousView = newHistory[newHistory.length - 1]
      setNavigationHistory(newHistory)
      setCurrentView(previousView)
    }
  }

  const canGoBack = navigationHistory.length > 1

  return (
    <RouterContext.Provider
      value={{
        currentView,
        setCurrentView: handleSetCurrentView,
        navigationHistory,
        goBack,
        canGoBack
      }}
    >
      {children}
    </RouterContext.Provider>
  )
}

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider')
  }
  return context
}

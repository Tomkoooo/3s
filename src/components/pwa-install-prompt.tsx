'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Share2, Plus } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

const isIOS = () => {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

const isStandalone = () => {
  if (typeof window === 'undefined') return false
  return (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const isMobile = useIsMobile()

  // Cookie helper functions
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  const setCookie = (name: string, value: string, days: number = 30) => {
    if (typeof document === 'undefined') return
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return

    // Check if user has previously dismissed the prompt
    const hasDeclined = getCookie('pwa-install-declined')
    if (hasDeclined) return

    // Only show on mobile devices
    if (!isMobile) return

    // iOS: Show manual guide
    if (isIOS()) {
      // Delay to avoid showing immediately on page load
      const timer = setTimeout(() => {
        setShowIOSGuide(true)
        setShowInstallPrompt(true)
      }, 3000)
      return () => clearTimeout(timer)
    }

    // Android: Use beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isMobile])

  const handleInstallClick = async () => {
    if (isIOS()) {
      setShowIOSGuide(true)
      return
    }

    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA installed successfully')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setCookie('pwa-install-declined', 'true', 30)
    setShowInstallPrompt(false)
    setShowIOSGuide(false)
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-4 max-w-sm mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            3SGP Alkalmazás Telepítése
          </h3>
          
          {showIOSGuide && isIOS() ? (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 space-y-2">
              <p>iOS-en telepítéshez:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Nyomd meg a <Share2 className="inline h-3 w-3" /> Share gombot</li>
                <li>Válaszd az <Plus className="inline h-3 w-3" /> "Kezdőlapra" opciót</li>
                <li>Kész! Az alkalmazás a kezdőlapodon lesz</li>
              </ol>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Telepítsd az alkalmazást az eszközödre a gyors hozzáférésért és jobb felhasználói élményért.
            </p>
          )}

          <div className="flex gap-2">
            {!isIOS() && (
              <Button onClick={handleInstallClick} size="sm">
                Telepítés
              </Button>
            )}
            <Button onClick={handleDismiss} variant="outline" size="sm">
              Most nem
            </Button>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="p-1 h-auto flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}


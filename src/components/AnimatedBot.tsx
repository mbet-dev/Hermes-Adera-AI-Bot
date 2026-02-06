'use client'

import React, { useEffect } from 'react'
import { Bot } from 'lucide-react'

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl') || canvas.getContext('webgl2')
    )
  } catch {
    return false
  }
}

export default function AnimatedBot({ className }: { className?: string }) {
  const supported = typeof window !== 'undefined' ? supportsWebGL() : true
  const isDesktop =
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 640px)').matches
      : false
  const rotationPerSecond = isDesktop ? '20deg' : '15deg'
  const heightRem = isDesktop ? '9rem' : '7rem'

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (customElements && customElements.get('model-viewer')) return

    const existing = document.querySelector('script[data-model-viewer]')
    if (existing) return

    const moduleScript = document.createElement('script')
    moduleScript.type = 'module'
    moduleScript.src = 'https://unpkg.com/@google/model-viewer@latest/dist/model-viewer.min.js'
    moduleScript.setAttribute('data-model-viewer', 'module')

    const legacyScript = document.createElement('script')
    legacyScript.noModule = true
    legacyScript.src = 'https://unpkg.com/@google/model-viewer@latest/dist/model-viewer-legacy.js'
    legacyScript.setAttribute('data-model-viewer', 'legacy')

    document.head.appendChild(moduleScript)
    document.head.appendChild(legacyScript)

    return () => {
      // keep scripts for other instances; do not remove
    }
  }, [])

  if (!supported) {
    return (
      <div className={`w-full h-40 sm:h-56 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ${className || ''}`}>
        <div className="flex items-center gap-2 text-primary">
          <Bot className="w-6 h-6" />
          <span className="text-sm">3D view unavailable</span>
        </div>
      </div>
    )
  }

  return (
    <div className={className || ''}>
      {React.createElement('model-viewer' as any, {
        src: '/assets/adera-bot.glb',
        autoplay: true,
        'auto-rotate': true,
        'rotation-per-second': rotationPerSecond,
        // camera controls disabled by omitting the attribute
        'shadow-intensity': '0.8',
        exposure: '1',
        'interaction-prompt': 'none',
        'disable-zoom': true,
        ar: 'false',
        loading: 'lazy',
        style: { width: '100%', height: heightRem, borderRadius: '0.75rem' },
      })}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const result = window.matchMedia(query)
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    result.addEventListener('change', onChange)
    return () => result.removeEventListener('change', onChange)
  }, [query])

  return value
}

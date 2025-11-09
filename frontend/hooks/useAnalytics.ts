'use client'

import { useEffect } from 'react'
import { analytics, type AnalyticsEvent } from '@/lib/analytics'

export function useAnalytics() {
  useEffect(() => {
    // Load analytics on mount
    analytics.load()
  }, [])

  const track = (event: AnalyticsEvent, data?: any) => {
    analytics.track(event, data)
  }

  const getStats = () => {
    return analytics.getStats()
  }

  const getEvents = (filter?: { event?: AnalyticsEvent; limit?: number }) => {
    return analytics.getEvents(filter)
  }

  const clear = () => {
    analytics.clear()
  }

  return {
    track,
    getStats,
    getEvents,
    clear,
  }
}


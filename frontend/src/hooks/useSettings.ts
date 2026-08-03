import { useState, useEffect, useCallback } from 'react'
import {
  GetSettings,
  SaveSettings,
  IsSetupComplete,
} from '../bindings'

type Settings = import("../bindings").Settings

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const s = await GetSettings()
      setSettings(s)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (s: Settings) => {
    try {
      setError(null)
      await SaveSettings(s)
      // Re-read from DB to confirm what was actually persisted
      const confirmed = await GetSettings()
      setSettings(confirmed)
      return true
    } catch (err) {
      setError(String(err))
      return false
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { settings, loading, error, load, save }
}

export function useSetupStatus() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const check = useCallback(async () => {
    try {
      setLoading(true)
      const result = await IsSetupComplete()
      setIsComplete(result)
    } catch {
      setIsComplete(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    check()
  }, [check])

  return { isComplete, loading, check }
}

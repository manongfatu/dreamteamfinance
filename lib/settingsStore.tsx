"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type Settings = {
  remindersEnabled: boolean;
  email: string;
};

type SettingsContextValue = {
  settings: Settings;
  setRemindersEnabled: (enabled: boolean) => void;
  setEmail: (email: string) => void;
};

const DEFAULTS: Settings = {
  remindersEnabled: false,
  email: ''
};

const STORAGE_KEY = 'pfm:settings:v1';

const SettingsContext = createContext<SettingsContextValue | null>(null);

function load(): Settings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as any;
    // Backward compatibility: migrate phoneNumber to email if present and looks like an email
    let email = parsed.email ?? '';
    if (!email && typeof parsed.phoneNumber === 'string' && parsed.phoneNumber.includes('@')) {
      email = parsed.phoneNumber;
    }
    return { ...DEFAULTS, ...parsed, email };
  } catch {
    return DEFAULTS;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => load());
  const ready = useRef(false);

  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const setRemindersEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, remindersEnabled: enabled }));
  }, []);
  const setEmail = useCallback((email: string) => {
    setSettings(prev => ({ ...prev, email }));
  }, []);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    setRemindersEnabled,
    setEmail
  }), [settings, setRemindersEnabled, setEmail]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}


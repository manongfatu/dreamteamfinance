"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

type Settings = {
  remindersEnabled: boolean;
  email: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
};

type SettingsContextValue = {
  settings: Settings;
  setRemindersEnabled: (enabled: boolean) => void;
  setEmail: (email: string) => void;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setContactNumber: (phone: string) => void;
  updateProfileAndSave: (firstName: string, lastName: string, contactNumber: string) => Promise<boolean>;
};

const DEFAULTS: Settings = {
  remindersEnabled: false,
  email: '',
  firstName: '',
  lastName: '',
  contactNumber: ''
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
  const readyRef = useRef(false);
  const [uid, setUid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const canSyncRef = useRef(false); // allow Firestore writes only after first hydration

  // Persist to localStorage and (if signed in) to Firestore
  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
    (async () => {
      if (!uid || !canSyncRef.current) return;
      try {
        const db = getFirestore();
        const ref = doc(db, 'users', uid, 'states', 'settings');
        await setDoc(
          ref,
          { data: settings, email: userEmail ?? settings.email ?? null, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch {
        // ignore network errors
      }
    })();
  }, [settings, uid, userEmail]);

  // Hydrate from Firestore when user logs in
  useEffect(() => {
    let unsubscribe: undefined | (() => void);
    (async () => {
      try {
        const auth = await getFirebaseAuth();
        unsubscribe = auth.onAuthStateChanged(async (u) => {
          setUid(u?.uid ?? null);
          setUserEmail(u?.email ?? null);
          canSyncRef.current = false;
          if (!u?.uid) return;
          try {
            const db = getFirestore();
            // Ensure root user doc exists with basic info
            await setDoc(doc(db, 'users', u.uid), {
              email: u.email ?? null,
              updatedAt: new Date().toISOString()
            }, { merge: true });

            const ref = doc(db, 'users', u.uid, 'states', 'settings');
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const remote = (snap.data()?.data ?? {}) as Partial<Settings>;
              setSettings((prev) => ({ ...prev, ...remote, email: prev.email || (u.email ?? '') }));
              canSyncRef.current = true;
            } else {
              const initial = { ...settings };
              if (!initial.email && u.email) initial.email = u.email;
              await setDoc(ref, { data: initial, email: u.email ?? null, updatedAt: new Date().toISOString() }, { merge: true });
              setSettings(initial);
              canSyncRef.current = true;
            }
          } catch {
            // ignore
            canSyncRef.current = false;
          }
        });
      } catch {
        // no auth in this environment
      }
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const setRemindersEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, remindersEnabled: enabled }));
  }, []);
  const setEmail = useCallback((email: string) => {
    setSettings(prev => ({ ...prev, email }));
  }, []);
  const setFirstName = useCallback((firstName: string) => {
    setSettings(prev => ({ ...prev, firstName }));
  }, []);
  const setLastName = useCallback((lastName: string) => {
    setSettings(prev => ({ ...prev, lastName }));
  }, []);
  const setContactNumber = useCallback((contactNumber: string) => {
    setSettings(prev => ({ ...prev, contactNumber }));
  }, []);

  // Explicit saver to avoid losing changes on quick logout/navigation
  const updateProfileAndSave = useCallback(async (firstName: string, lastName: string, contactNumber: string) => {
    const next = { ...settings, firstName, lastName, contactNumber };
    setSettings(next);
    try {
      // persist local immediately
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      // persist remote if signed in and hydrated
      if (uid && canSyncRef.current) {
        const db = getFirestore();
        const ref = doc(db, 'users', uid, 'states', 'settings');
        await setDoc(
          ref,
          { data: next, email: userEmail ?? next.email ?? null, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
      return true;
    } catch {
      return false;
    }
  }, [settings, uid, userEmail]);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    setRemindersEnabled,
    setEmail,
    setFirstName,
    setLastName,
    setContactNumber,
    updateProfileAndSave
  }), [settings, setRemindersEnabled, setEmail, setFirstName, setLastName, setContactNumber, updateProfileAndSave]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}


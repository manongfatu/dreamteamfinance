"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import type {
  Entry,
  MonthData,
  SummaryTotals,
  YearData,
  Installment,
  InstallmentScheduleItem
} from '../types/finance';
import { getCurrentYear } from './date';
import { getFirebaseAuth } from './firebase/client';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

type FinanceContextValue = {
  year: number;
  data: YearData;
  getMonthData: (monthIndex: number) => MonthData;
  addEntry: (monthIndex: number, entry: Omit<Entry, 'id'>) => void;
  updateEntry: (monthIndex: number, id: string, updates: Partial<Omit<Entry, 'id'>>) => void;
  deleteEntry: (monthIndex: number, id: string) => void;
  clearMonth: (monthIndex: number) => void;
  // Installments
  getInstallments: () => Installment[];
  addInstallment: (installment: Omit<Installment, 'id' | 'schedule' | 'createdAt'>) => void;
  updateInstallment: (id: string, updates: Partial<Omit<Installment, 'id' | 'schedule' | 'createdAt'>>) => void;
  deleteInstallment: (id: string) => void;
  toggleInstallmentPayment: (installmentId: string, year: number, monthIndex: number, paid: boolean) => void;
  computeTotals: (entries: Entry[]) => SummaryTotals;
  computeYtdTotals: () => SummaryTotals;
  allEntriesYtd: () => Entry[];
  flushRemote: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

const STORAGE_KEY = 'pfm:v1';

function emptyYear(year: number): YearData {
  return {
    year,
    months: new Array(12).fill(null).map((_, idx) => ({
      monthIndex: idx,
      entries: []
    })),
    installments: []
  };
}

function loadFromStorage(): YearData {
  if (typeof window === 'undefined') return emptyYear(getCurrentYear());
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyYear(getCurrentYear());
    const parsed = JSON.parse(raw) as YearData;
    // If stored year is not current, keep data but ensure structure
    if (!parsed || !Array.isArray(parsed.months) || parsed.months.length !== 12) {
      return emptyYear(getCurrentYear());
    }
    return {
      ...parsed,
      installments: Array.isArray(parsed.installments) ? parsed.installments : []
    };
  } catch {
    return emptyYear(getCurrentYear());
  }
}

function persistToStorage(data: YearData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota
  }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<YearData>(() => loadFromStorage());
  const [uid, setUid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const initialised = useRef(false);
  const syncing = useRef(false);
  const canSyncRef = useRef(false); // allow Firestore writes only after first hydration
  const unsubscribeRef = useRef<null | (() => void)>(null);

  const saveRemote = useCallback(async (next: YearData) => {
    if (!uid || !canSyncRef.current) return;
    try {
      const db = getFirestore();
      const ref = doc(db, 'users', uid, 'states', 'finance');
      await setDoc(ref, { data: next, email: userEmail ?? null, updatedAt: new Date().toISOString() }, { merge: true });
    } catch {
      // swallow; UI stays responsive and localStorage has a copy
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('[finance] Failed to write to Firestore');
      }
    }
  }, [uid, userEmail]);

  // Persist on changes
  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      return;
    }
    persistToStorage(data);
    // Also persist to Firestore under the logged-in user
    (async () => {
      if (!uid || !canSyncRef.current) return;
      try {
        const db = getFirestore();
        const ref = doc(db, 'users', uid, 'states', 'finance');
        // avoid echo loops
        if (syncing.current) return;
        await setDoc(ref, { data, email: userEmail ?? null, updatedAt: new Date().toISOString() }, { merge: true });
      } catch {
        // ignore network errors - localStorage still has a copy
      }
    })();
  }, [data]);

  // Attach to auth and hydrate from Firestore if available
  useEffect(() => {
    let authUnsub: (() => void) | undefined;
    (async () => {
      try {
        const auth = await getFirebaseAuth();
        authUnsub = auth.onAuthStateChanged(async (u) => {
          setUid(u?.uid ?? null);
          setUserEmail(u?.email ?? null);
          canSyncRef.current = false;
          // detach previous finance snapshot
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
          }
          if (!u?.uid) return;
          try {
            const db = getFirestore();
            // Ensure root user doc exists with basic info
            await setDoc(doc(db, 'users', u.uid), {
              email: u.email ?? null,
              updatedAt: new Date().toISOString()
            }, { merge: true });

            const ref = doc(db, 'users', u.uid, 'states', 'finance');
            // Initial one-time fetch to decide whether to seed remote
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              // Seed remote with current local if nothing exists yet (first-time user)
              await setDoc(ref, { data, email: u.email ?? null, updatedAt: new Date().toISOString() }, { merge: true });
            } else {
              const remote = snap.data()?.data as YearData | undefined;
              if (remote && Array.isArray(remote.months) && remote.months.length === 12) {
                syncing.current = true;
                setData(remote);
                syncing.current = false;
              }
            }
            // Subscribe to live updates so we always rehydrate from remote
            unsubscribeRef.current = onSnapshot(ref, (docSnap) => {
              if (!docSnap.exists()) return;
              const remote = docSnap.data()?.data as YearData | undefined;
              if (!remote || !Array.isArray(remote.months) || remote.months.length !== 12) return;
              syncing.current = true;
              setData(remote);
              syncing.current = false;
            });
            canSyncRef.current = true;
          } catch {
            // ignore fetch errors; keep local state
            canSyncRef.current = false;
          }
        });
      } catch {
        // auth not available, skip
      }
    })();
    return () => { if (authUnsub) authUnsub(); if (unsubscribeRef.current) unsubscribeRef.current(); };
  }, []);

  // Flush when page is hidden/unloaded to reduce data loss risk
  useEffect(() => {
    const handler = () => { void saveRemote(data); };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handler);
      window.addEventListener('beforeunload', handler);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handler);
        window.removeEventListener('beforeunload', handler);
      }
    };
  }, [data, saveRemote]);

  // Helper to get month
  const getMonthData = useCallback((monthIndex: number) => {
    return data.months[monthIndex];
  }, [data.months]);

  const addEntry = useCallback((monthIndex: number, entry: Omit<Entry, 'id'>) => {
    setData(prev => {
      const months = [...prev.months];
      const month = { ...months[monthIndex], entries: [...months[monthIndex].entries] };
      const nextEntry = { ...entry, id: nanoid() };
      month.entries.unshift(nextEntry);
      months[monthIndex] = month;
      const next = { ...prev, months };
      void saveRemote(next);
      return next;
    });
  }, [saveRemote]);

  const updateEntry = useCallback((monthIndex: number, id: string, updates: Partial<Omit<Entry, 'id'>>) => {
    setData(prev => {
      const months = [...prev.months];
      const month = { ...months[monthIndex], entries: months[monthIndex].entries.map(e => e.id === id ? { ...e, ...updates } : e) };
      months[monthIndex] = month;
      const next = { ...prev, months };
      void saveRemote(next);
      return next;
    });
  }, [saveRemote]);

  const deleteEntry = useCallback((monthIndex: number, id: string) => {
    setData(prev => {
      const months = [...prev.months];
      const month = { ...months[monthIndex], entries: months[monthIndex].entries.filter(e => e.id !== id) };
      months[monthIndex] = month;
      const next = { ...prev, months };
      void saveRemote(next);
      return next;
    });
  }, [saveRemote]);

  const clearMonth = useCallback((monthIndex: number) => {
    setData(prev => {
      const months = [...prev.months];
      months[monthIndex] = { ...months[monthIndex], entries: [] };
      const next = { ...prev, months };
      void saveRemote(next);
      return next;
    });
  }, [saveRemote]);

  // Build a schedule starting from startDate for numberOfMonths
  const buildSchedule = useCallback((startDateISO: string, numberOfMonths: number): InstallmentScheduleItem[] => {
    const start = new Date(startDateISO);
    const startDay = start.getDate();
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();
    const items: InstallmentScheduleItem[] = [];
    for (let i = 0; i < numberOfMonths; i++) {
      const date = new Date(startYear, startMonth + i, startDay);
      items.push({
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        dueDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
        paid: false
      });
    }
    return items;
  }, []);

  const getInstallments = useCallback(() => {
    return data.installments ?? [];
  }, [data.installments]);

  const addInstallment = useCallback((installment: Omit<Installment, 'id' | 'schedule' | 'createdAt'>) => {
    setData(prev => {
      const schedule = buildSchedule(installment.startDate, installment.numberOfMonths);
      const nextInstallment: Installment = {
        ...installment,
        id: nanoid(),
        schedule,
        createdAt: new Date().toISOString()
      };
      const installments = [...(prev.installments ?? []), nextInstallment];
      const next = { ...prev, installments };
      void saveRemote(next);
      return next;
    });
  }, [buildSchedule, saveRemote]);

  const updateInstallment = useCallback((id: string, updates: Partial<Omit<Installment, 'id' | 'schedule' | 'createdAt'>>) => {
    setData(prev => {
      const installments = (prev.installments ?? []).map(ins => ins.id === id ? { ...ins, ...updates } : ins);
      const next = { ...prev, installments };
      void saveRemote(next);
      return next;
    });
  }, [saveRemote]);

  const deleteInstallment = useCallback((id: string) => {
    setData(prev => {
      const installments = (prev.installments ?? []).filter(ins => ins.id !== id);
      const next = { ...prev, installments };
      void saveRemote(next);
      return next;
    });
  }, [saveRemote]);

  const toggleInstallmentPayment = useCallback((installmentId: string, year: number, monthIndex: number, paid: boolean) => {
    setData(prev => {
      const next = { ...prev, months: [...prev.months], installments: [...(prev.installments ?? [])] };
      const installmentIdx = next.installments!.findIndex(i => i.id === installmentId);
      if (installmentIdx < 0) return prev;
      const installment = { ...next.installments![installmentIdx] };
      const schedIdx = installment.schedule.findIndex(s => s.year === year && s.monthIndex === monthIndex);
      if (schedIdx < 0) return prev;
      const schedItem = { ...installment.schedule[schedIdx] };

      // Ensure target month exists
      const month = { ...next.months[monthIndex], entries: [...next.months[monthIndex].entries] };

      if (paid) {
        // Add entry if missing
        if (!schedItem.entryId) {
          const id = nanoid();
          const entry: Entry = {
            id,
            title: `${installment.itemName} (Installment)`,
            amount: installment.monthlyAmount,
            entryType: "installment",
            category: "Installment",
            date: new Date(schedItem.dueDate).toISOString(),
            notes: `Auto-generated from installment ${installment.itemName}`,
            paid: true
          };
          month.entries.unshift(entry);
          schedItem.entryId = id;
        } else {
          // Ensure existing entry is marked paid
          const idx = month.entries.findIndex(e => e.id === schedItem.entryId);
          if (idx >= 0) {
            month.entries[idx] = { ...month.entries[idx], paid: true };
          }
        }
        schedItem.paid = true;
      } else {
        // Remove generated entry if exists
        if (schedItem.entryId) {
          const idx = month.entries.findIndex(e => e.id === schedItem.entryId);
          if (idx >= 0) month.entries.splice(idx, 1);
          schedItem.entryId = undefined;
        }
        schedItem.paid = false;
      }

      installment.schedule[schedIdx] = schedItem;
      next.installments![installmentIdx] = installment;
      next.months[monthIndex] = month;
      void saveRemote(next);
      return next;
    });
  }, [saveRemote]);

  const computeTotals = useCallback((entries: Entry[]): SummaryTotals => {
    const totals = {
      income: 0,
      expenses: 0,
      bills: 0,
      savings: 0,
      investments: 0,
      installments: 0,
      net: 0
    };
    for (const e of entries) {
      const amt = Number.isFinite(e.amount) ? e.amount : 0;
      if (e.entryType === 'income') totals.income += amt;
      else if (e.entryType === 'expense') totals.expenses += amt;
      else if (e.entryType === 'bill') totals.bills += amt;
      else if (e.entryType === 'savings') totals.savings += amt;
      else if (e.entryType === 'investment') totals.investments += amt;
      else if (e.entryType === 'installment') totals.installments += amt;
    }
    totals.net = totals.income - (totals.expenses + totals.bills + totals.savings + totals.investments + totals.installments);
    return totals;
  }, []);

  const allEntriesYtd = useCallback((): Entry[] => {
    return data.months.flatMap(m => m.entries);
  }, [data.months]);

  const computeYtdTotals = useCallback(() => computeTotals(allEntriesYtd()), [computeTotals, allEntriesYtd]);

  const value: FinanceContextValue = useMemo(() => ({
    year: data.year,
    data,
    getMonthData,
    addEntry,
    updateEntry,
    deleteEntry,
    clearMonth,
    getInstallments,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    toggleInstallmentPayment,
    computeTotals,
    computeYtdTotals,
    allEntriesYtd,
    flushRemote: () => saveRemote(data)
  }), [
    data,
    getMonthData,
    addEntry,
    updateEntry,
    deleteEntry,
    clearMonth,
    getInstallments,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    toggleInstallmentPayment,
    computeTotals,
    computeYtdTotals,
    allEntriesYtd,
    saveRemote
  ]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}


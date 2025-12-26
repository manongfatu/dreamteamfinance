"use client";
import { useEffect, useRef } from 'react';
import { useFinance } from '@lib/financeStore';
import { useSettings } from '@lib/settingsStore';

const LAST_KEY = 'pfm:lastReminderCheck';

export default function ReminderRunner() {
  const { data, getInstallments } = useFinance();
  const { settings } = useSettings();
  const running = useRef(false);

  useEffect(() => {
    if (running.current) return;
    running.current = true;

    const now = new Date();
    const last = typeof window !== 'undefined' ? localStorage.getItem(LAST_KEY) : null;
    const lastDate = last ? new Date(last) : null;
    // Run at most once per day
    if (lastDate && lastDate.toDateString() === now.toDateString()) return;

    try {
      const threeDaysFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
      const upcoming = (getInstallments() || []).flatMap(ins =>
        ins.schedule.filter(s => !s.paid && new Date(s.dueDate).toDateString() === threeDaysFromNow.toDateString())
          .map(s => ({ ins, s }))
      );

      if (!upcoming.length) {
        localStorage.setItem(LAST_KEY, now.toISOString());
        return;
      }

      const subject = 'Dream Team Finance: Upcoming installment due in 3 days';
      const message = `You have ${upcoming.length} installment payment(s) due in 3 days.\n\n` +
        upcoming.slice(0, 10).map(({ ins, s }) =>
          `• ${ins.itemName} on ${new Date(s.dueDate).toLocaleDateString()} (${ins.monthlyAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })})`
        ).join('\n') +
        (upcoming.length > 10 ? `\n…and ${upcoming.length - 10} more.` : '');

      if (settings.remindersEnabled && settings.email) {
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: settings.email, subject, text: message })
        }).catch(() => {});
      }

      // In-app fallback
      if (typeof window !== 'undefined') {
        try {
          // Prefer Notifications API if available
          if ('Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification(subject, { body: message });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then((perm) => {
                if (perm === 'granted') new Notification(subject, { body: message });
              });
            }
          } else {
            alert(message);
          }
        } catch {
          // ignore
        }
      }
    } finally {
      localStorage.setItem(LAST_KEY, new Date().toISOString());
    }
  }, [data.year, getInstallments, settings.email, settings.remindersEnabled]);

  return null;
}


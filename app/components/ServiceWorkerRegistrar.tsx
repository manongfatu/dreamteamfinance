"use client";
import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const register = async () => {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch {
          // no-op
        }
      };
      register();
    }
  }, []);
  return null;
}


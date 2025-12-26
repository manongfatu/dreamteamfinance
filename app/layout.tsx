import './globals.css';
import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegistrar from './components/ServiceWorkerRegistrar';
import { FinanceProvider } from '../lib/financeStore';
import { SettingsProvider } from '../lib/settingsStore';
import ReminderRunner from './components/ReminderRunner';
import AppShell from './components/AppShell';

export const metadata: Metadata = {
  title: 'Dream Team Finance',
  description: 'Track income, expenses, bills, savings, and investments by month.',
  applicationName: 'Dream Team Finance',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg'
  }
};

export const viewport: Viewport = {
  themeColor: '#0f172a'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`theme`}>
        <SettingsProvider>
          <FinanceProvider>
            <AppShell>
              {children}
            </AppShell>
            <ReminderRunner />
          </FinanceProvider>
        </SettingsProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}


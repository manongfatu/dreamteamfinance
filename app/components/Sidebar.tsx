"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MONTHS } from '@lib/date';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { useSettings } from '@lib/settingsStore';

function IconHome() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
      <path d="M9 20v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18" />
      <rect x="5" y="10" width="3" height="8" rx="1" />
      <rect x="10.5" y="6" width="3" height="12" rx="1" />
      <rect x="16" y="12" width="3" height="6" rx="1" />
    </svg>
  );
}
function IconReceipt() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h9a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z" />
      <path d="M8 8h7M8 12h7M8 16h5" />
    </svg>
  );
}
function IconCog() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1A2 2 0 0 1 4.3 18l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H3.6a2 2 0 0 1 0-4h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1A2 2 0 0 1 6.1 4.6l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V3.6a2 2 0 0 1 4 0v.1a1 1 0 0 0 .6.9h.1a1 1 0 0 0 1.1-.2l.1-.1A2 2 0 0 1 19.7 6l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6h.1a2 2 0 0 1 0 4h-.1a1 1 0 0 0-.9.6z" />
    </svg>
  );
}

export default function Sidebar({
  open = false,
  collapsed = false,
  onToggleCollapse,
  onNavigate
}: {
  open?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || '/';
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isMonthActive = (slug: string) => pathname.includes(`/month/${slug}`);
  const [email, setEmail] = useState<string | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    (async () => {
      try {
        const auth = await getFirebaseAuth();
        const unsub = auth.onAuthStateChanged(u => setEmail(u?.email ?? null));
        return () => unsub();
      } catch {
        setEmail(null);
      }
    })();
  }, []);

  const firstName = useMemo(() => {
    const fromSettings = (settings.firstName || '').trim();
    if (fromSettings) return fromSettings;
    // Fallback to auth display: use email local-part if no name
    if (email) return email.split('@')[0];
    return '';
  }, [settings.firstName, email]);

  return (
    <aside className={clsx("sidebar", { open, collapsed })}>
      <div className="brand-row">
        <div className="brand">Dream Team Finance</div>
        <button
          className="button ghost collapse-btn"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapse}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      {!collapsed && (firstName || email) ? (
        <div className="greeting">
          <span>Hola, </span>
          <span className="name">{firstName || email}</span>
          <span>!</span>
        </div>
      ) : null}

      <nav className="nav">
        <div className="nav-section-label">Overview</div>
        <Link href="/" className={clsx('nav-link', { active: isActive('/') })} onClick={onNavigate}>
          <IconHome />
          <span className="label">Dashboard</span>
        </Link>
        <Link href="/aggregate" className={clsx('nav-link', { active: isActive('/aggregate') })} onClick={onNavigate}>
          <IconChart />
          <span className="label">Year-to-date</span>
        </Link>
        <Link href="/installments" className={clsx('nav-link', { active: isActive('/installments') })} onClick={onNavigate}>
          <IconReceipt />
          <span className="label">Installments</span>
        </Link>
        <Link href="/settings" className={clsx('nav-link', { active: isActive('/settings') })} onClick={onNavigate}>
          <IconCog />
          <span className="label">Settings</span>
        </Link>
      </nav>

      <nav className="nav" style={{ marginTop: 16 }}>
        <div className="nav-section-label">Months</div>
        <div className="month-list">
          {MONTHS.map(m => (
            <Link
              key={m.slug}
              href={`/month/${m.slug}`}
              className={clsx('nav-pill', { active: isMonthActive(m.slug) })}
              onClick={onNavigate}
            >
              {m.name.slice(0, 3)}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}


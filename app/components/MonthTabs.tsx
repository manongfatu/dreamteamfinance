"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MONTHS } from '@lib/date';
import clsx from 'clsx';

const dashboard = { slug: 'dashboard', name: 'Dashboard' };
const installments = { slug: 'installments', name: 'Installments' };

export default function MonthTabs() {
  const pathname = usePathname();
  const isActive = (slug: string) =>
    pathname?.includes(`/month/${slug}`) ||
    pathname === `/${slug}` ||
    (slug === 'dashboard' && (pathname === '/' || pathname?.startsWith('/aggregate'))) ||
    (slug === 'installments' && pathname?.startsWith('/installments'));

  return (
    <div className="tabs">
      {MONTHS.map(m => (
        <Link key={m.slug} href={`/month/${m.slug}`} className={clsx('tab', { 'active': isActive(m.slug) })}>
          {m.name.slice(0, 3)}
        </Link>
      ))}
      <Link href="/" className={clsx('tab', { 'active': isActive('dashboard') })}>
        {dashboard.name}
      </Link>
      <Link href="/installments" className={clsx('tab', { 'active': isActive('installments') })}>
        {installments.name}
      </Link>
    </div>
  );
}


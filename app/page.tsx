"use client";
import { useFinance } from '@lib/financeStore';
import dynamic from 'next/dynamic';
const SummaryCards = dynamic(() => import('./shared/SummaryCards'), { ssr: false });
const IncomeExpenseBarChart = dynamic(() => import('./shared/charts/IncomeExpenseBarChart'), { ssr: false });
const CategoryPieChart = dynamic(() => import('./shared/charts/CategoryPieChart'), { ssr: false });
import { MONTHS } from '@lib/date';
import { exportYearCsv } from '@utils/csv';
import { useMemo } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';

export default function DashboardPage() {
  const { data, isReady, computeTotals, computeYtdTotals, allEntriesYtd, flushRemote } = useFinance();

  const ytdTotals = computeYtdTotals();
  const barData = useMemo(() => {
    return MONTHS.map(m => {
      const totals = computeTotals(data.months[m.index].entries);
      return { name: m.name.slice(0, 3), income: totals.income, expenses: totals.expenses + totals.bills + totals.savings + totals.investments + totals.installments };
    });
  }, [computeTotals, data.months]);

  const entries = allEntriesYtd();

  if (!isReady) {
    return <div className="container"><div className="card"><div className="card-body">Restoring your data…</div></div></div>;
  }
  return (
    <div className="container">
      <header className="app-header">
        <div className="title">Dashboard · {data.year}</div>
        <div className="controls">
          <button
            className="button"
            onClick={async () => {
              try {
                // Flush latest finance state to Firestore before logging out
                let saved = false;
                try { saved = await flushRemote(); } catch { saved = false; }
                // Clear local only if we confirmed remote save, else keep as fallback
                if (saved) { try { localStorage.removeItem('pfm:v1'); } catch {} }
                // Sign out Firebase client
                try { const auth = await getFirebaseAuth(); await signOut(auth); } catch {}
                // Clear session cookie on server
                await fetch('/api/session/logout', { method: 'POST' });
              } finally {
                window.location.href = '/login';
              }
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="grid grid-2">
        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title">Year-to-date Summary</div>
            <div className="controls">
              <button className="button" onClick={() => exportYearCsv(data.year, entries)}>Export CSV</button>
            </div>
          </div>
          <div className="card-body">
            <SummaryCards totals={ytdTotals} />
          </div>
        </div>

        <div className="grid">
          <div className="card fade-in">
            <div className="card-header">
              <div className="card-title">Monthly Income vs Expenses</div>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              <IncomeExpenseBarChart data={barData} />
            </div>
          </div>

          <div className="card fade-in">
            <div className="card-header">
              <div className="card-title">Category Distribution (YTD Expenses)</div>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              <CategoryPieChart entries={entries} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


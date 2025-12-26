"use client";
import { useMemo, useState } from 'react';
import { indexToMonthName, monthSlugToIndex } from '@lib/date';
import { useFinance } from '@lib/financeStore';
import type { Entry, EntryType } from '@domain/finance';
import EntryForm from '../../shared/EntryForm';
import dynamic from 'next/dynamic';
const EntryList = dynamic(() => import('../../shared/EntryList'), { ssr: false });
const SummaryCards = dynamic(() => import('../../shared/SummaryCards'), { ssr: false });
const InstallmentsThisMonth = dynamic(() => import('../../shared/InstallmentsThisMonth'), { ssr: false });
import { useParams } from 'next/navigation';
import { exportMonthCsv } from '@utils/csv';

export default function MonthPage() {
  const params = useParams<{ month: string }>();
  const monthSlug = params.month;
  const monthIndex = monthSlugToIndex(monthSlug);
  const monthName = indexToMonthName(monthIndex);
  const { getMonthData, computeTotals, addEntry, updateEntry, deleteEntry, clearMonth } = useFinance();

  const monthData = getMonthData(monthIndex);
  const totals = useMemo(() => computeTotals(monthData.entries), [computeTotals, monthData.entries]);

  const [editing, setEditing] = useState<Entry | null>(null);

  return (
    <div className="container">
      <header className="app-header">
        <div className="title">{monthName} {useFinance().year}</div>
      </header>

      <div className="grid grid-2">
        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title">{editing ? 'Edit entry' : 'Add entry'}</div>
            {editing ? (
              <div className="controls">
                <button className="button" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            ) : null}
          </div>
          <div className="card-body">
            <EntryForm
              initial={editing ?? undefined}
              onSubmit={(payload) => {
                if (editing) {
                  updateEntry(monthIndex, editing.id, payload);
                  setEditing(null);
                } else {
                  addEntry(monthIndex, payload);
                }
              }}
            />
          </div>
        </div>

        <div className="grid">
          <div className="card fade-in">
            <div className="card-header">
              <div className="card-title">Installments this month</div>
            </div>
            <div className="card-body">
              <InstallmentsThisMonth monthIndex={monthIndex} year={useFinance().year} />
            </div>
          </div>

          <div className="card fade-in">
            <div className="card-header">
              <div className="card-title">Summary</div>
              <div className="controls">
                <button className="button" onClick={() => exportMonthCsv(monthIndex, monthData.entries)}>Export CSV</button>
                <button className="button danger" onClick={() => clearMonth(monthIndex)}>Clear Month</button>
              </div>
            </div>
            <div className="card-body">
              <SummaryCards totals={totals} />
            </div>
          </div>
        </div>

        <div className="card fade-in" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">Entries</div>
          </div>
          <div className="card-body">
            <EntryList
              entries={monthData.entries}
              onEdit={setEditing}
              onDelete={(id) => deleteEntry(monthIndex, id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";
import { Entry } from '@domain/finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#f43f5e', '#22d3ee', '#a78bfa', '#f472b6', '#10b981'];

export default function CategoryPieChart({ entries }: { entries: Entry[] }) {
  const expenses = entries.filter(e => e.entryType === 'expense' || e.entryType === 'bill' || e.entryType === 'savings' || e.entryType === 'investment');
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    const key = (e.category ?? '').trim() || 'Uncategorized';
    byCategory.set(key, (byCategory.get(key) ?? 0) + e.amount);
  }
  const data = Array.from(byCategory.entries()).map(([name, value]) => ({ name, value }));

  if (!data.length) return <div className="hint">No expense data yet.</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius="80%">
          {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid rgba(2,6,23,0.08)', borderRadius: 10 }}
          labelStyle={{ color: 'var(--muted)' }}
        />
        <Legend wrapperStyle={{ color: 'var(--muted)' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}


"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

type Props = {
  data: { name: string; income: number; expenses: number }[];
};

export default function IncomeExpenseBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(2,6,23,0.08)" />
        <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
        <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid rgba(2,6,23,0.08)', borderRadius: 10 }}
          labelStyle={{ color: 'var(--muted)' }}
        />
        <Legend wrapperStyle={{ color: 'var(--muted)' }} />
        <Bar dataKey="income" fill="#22c55e" name="Income" />
        <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
      </BarChart>
    </ResponsiveContainer>
  );
}


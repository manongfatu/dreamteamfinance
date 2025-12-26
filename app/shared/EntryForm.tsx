"use client";
import { useEffect, useMemo, useState } from 'react';
import type { Entry, EntryType } from '@domain/finance';

type Props = {
  initial?: Entry;
  onSubmit: (payload: Omit<Entry, 'id'>) => void;
};

const ENTRY_TYPES: { label: string; value: EntryType }[] = [
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
  { label: 'Bill', value: 'bill' },
  { label: 'Savings', value: 'savings' },
  { label: 'Investment', value: 'investment' }
];

export default function EntryForm({ initial, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [entryType, setEntryType] = useState<EntryType>(initial?.entryType ?? 'expense');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [date, setDate] = useState(initial?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    setTitle(initial.title);
    setAmount(initial.amount.toString());
    setEntryType(initial.entryType);
    setCategory(initial.category);
    setDate(initial.date.slice(0, 10));
    setNotes(initial.notes ?? '');
  }, [initial?.id]);

  const isValid = useMemo(() => {
    const amt = Number(amount);
    return title.trim().length > 0 && Number.isFinite(amt) && amt >= 0 && category.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  }, [title, amount, category, date]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setErrors('Please fill all required fields. Amount must be a valid number.');
      return;
    }
    const payload: Omit<Entry, 'id'> = {
      title: title.trim(),
      amount: Number(amount),
      entryType,
      category: category.trim(),
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined
    };
    onSubmit(payload);
    // reset
    if (!initial) {
      setTitle('');
      setAmount('');
      setEntryType('expense');
      setCategory('');
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
    setErrors(null);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="row">
        <div className="field">
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Salary, Groceries, Rent" required />
        </div>
        <div className="field">
          <label className="label">Amount</label>
          <input className="input" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" inputMode="decimal" />
          <div className="hint">Enter a positive number</div>
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label className="label">Type</label>
          <select className="select" value={entryType} onChange={(e) => setEntryType(e.target.value as EntryType)}>
            {ENTRY_TYPES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </select>
        </div>
        <div className="field">
          <label className="label">Category</label>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Food, Rent, Utilities" />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Notes</label>
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      {errors ? <div className="error">{errors}</div> : <div className="hint">Entries save instantly. No reloads.</div>}
      <div className="controls">
        <button className="button primary" type="submit">{initial ? 'Save Changes' : 'Add Entry'}</button>
      </div>
    </form>
  );
}


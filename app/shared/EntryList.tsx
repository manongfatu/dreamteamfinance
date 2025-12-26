"use client";
import type { Entry } from '@domain/finance';
import { formatCurrency } from '@lib/currency';

function TypeBadge({ type }: { type: Entry['entryType'] }) {
  const color =
    type === 'income' ? 'var(--ok)' :
    type === 'expense' ? 'var(--danger)' :
    type === 'bill' ? 'var(--warning)' :
    'var(--primary)';
  return <span style={{ color, fontWeight: 600 }}>{type}</span>;
}

export default function EntryList({
  entries,
  onEdit,
  onDelete
}: {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
}) {
  if (!entries.length) {
    return <div className="hint">No entries yet. Add your first item using the form above.</div>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th style={{ minWidth: 120 }}>Title</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Category</th>
            <th>Date</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id}>
              <td>{e.title}</td>
              <td>{formatCurrency(e.amount)}</td>
              <td><TypeBadge type={e.entryType} /></td>
              <td>{e.category}</td>
              <td>{new Date(e.date).toLocaleDateString()}</td>
              <td style={{ maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.notes ?? ''}</td>
              <td style={{ textAlign: 'right' }}>
                <div className="controls" style={{ justifyContent: 'flex-end' }}>
                  <button className="button" onClick={() => onEdit(e)}>Edit</button>
                  <button className="button danger" onClick={() => onDelete(e.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


import type { SummaryTotals } from '@domain/finance';
import { formatCurrency } from '@lib/currency';

export default function SummaryCards({ totals }: { totals: SummaryTotals }) {
  const items = [
    { label: 'Income', value: totals.income, color: 'var(--ok)' },
    { label: 'Expenses', value: totals.expenses, color: 'var(--danger)' },
    { label: 'Bills', value: totals.bills, color: 'var(--warning)' },
    { label: 'Savings', value: totals.savings, color: 'var(--primary)' },
    { label: 'Investments', value: totals.investments, color: 'var(--primary)' },
    { label: 'Installments', value: totals.installments, color: 'var(--primary)' },
    { label: 'Net', value: totals.net, color: totals.net >= 0 ? 'var(--ok)' : 'var(--danger)' }
  ];
  const format = (n: number) => formatCurrency(n);

  return (
    <div className="summary-cards">
      {items.map((i) => (
        <div key={i.label} className="summary-item">
          <div className="summary-label">{i.label}</div>
          <div className="summary-value" style={{ color: i.color }}>{format(i.value)}</div>
        </div>
      ))}
    </div>
  );
}


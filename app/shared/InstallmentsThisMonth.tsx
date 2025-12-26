"use client";
import { useFinance } from '@lib/financeStore';
import { formatCurrency } from '@lib/currency';

export default function InstallmentsThisMonth({ monthIndex, year }: { monthIndex: number; year: number }) {
  const { getInstallments, toggleInstallmentPayment } = useFinance();
  const installments = getInstallments();

  const items = installments.flatMap(ins => {
    const s = ins.schedule.find(x => x.year === year && x.monthIndex === monthIndex);
    if (!s) return [];
    return [{
      installmentId: ins.id,
      itemName: ins.itemName,
      monthlyAmount: ins.monthlyAmount,
      remainingMonths: ins.schedule.filter(x => !x.paid).length,
      paidMonths: ins.schedule.filter(x => x.paid).length,
      dueDate: s.dueDate,
      paid: s.paid
    }];
  });

  if (!items.length) {
    return <div className="hint">No installment payments due this month.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Monthly</th>
            <th>Due date</th>
            <th>Progress</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map(i => (
            <tr key={`${i.installmentId}-${i.dueDate}`}>
              <td>{i.itemName}</td>
              <td>{formatCurrency(i.monthlyAmount)}</td>
              <td>{new Date(i.dueDate).toLocaleDateString()}</td>
              <td>{i.paidMonths} paid · {i.remainingMonths} remaining</td>
              <td>{i.paid ? 'Paid' : 'Unpaid'}</td>
              <td style={{ textAlign: 'right' }}>
                <div className="controls" style={{ justifyContent: 'flex-end' }}>
                  <button className="button" onClick={() => toggleInstallmentPayment(i.installmentId, year, monthIndex, !i.paid)}>{i.paid ? 'Mark Unpaid' : 'Mark Paid'}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


"use client";
import { useFinance } from '@lib/financeStore';
import InstallmentForm from '../shared/InstallmentForm';
import { formatCurrency } from '@lib/currency';

export default function InstallmentsPage() {
  const { data, getInstallments, toggleInstallmentPayment, deleteInstallment } = useFinance();
  const installments = getInstallments();

  return (
    <div className="container">
      <header className="app-header">
        <div className="title">Installments · {data.year}</div>
      </header>

      <div className="grid grid-2">
        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title">Add Installment</div>
          </div>
          <div className="card-body">
            <InstallmentForm />
          </div>
        </div>

        <div className="card fade-in" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">All Installments</div>
          </div>
          <div className="card-body">
            {!installments.length ? (
              <div className="hint">No installments yet. Add your first plan with the form above.</div>
            ) : (
              <div className="grid">
                {installments.map(ins => {
                  const paidCount = ins.schedule.filter(s => s.paid).length;
                  const remainingCount = ins.schedule.length - paidCount;
                  const remainingBalance = Math.max(0, ins.totalAmount - (ins.downPayment ?? 0) - paidCount * ins.monthlyAmount);
                  const endDate = ins.schedule[ins.schedule.length - 1]?.dueDate;
                  return (
                    <div key={ins.id} className="card">
                      <div className="card-header">
                        <div className="card-title" style={{ color: 'var(--text)' }}>{ins.itemName}</div>
                        <div className="controls">
                          <button className="button danger" onClick={() => deleteInstallment(ins.id)}>Delete</button>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                          <div className="summary-item">
                            <div className="summary-label">Total</div>
                            <div className="summary-value">{formatCurrency(ins.totalAmount)}</div>
                          </div>
                          <div className="summary-item">
                            <div className="summary-label">Monthly</div>
                            <div className="summary-value">{formatCurrency(ins.monthlyAmount)}</div>
                          </div>
                          <div className="summary-item">
                            <div className="summary-label">Paid / Remaining</div>
                            <div className="summary-value">{paidCount} / {remainingCount}</div>
                          </div>
                          <div className="summary-item">
                            <div className="summary-label">Remaining balance</div>
                            <div className="summary-value">{formatCurrency(remainingBalance)}</div>
                          </div>
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <div className="hint" style={{ marginBottom: 6 }}>Progress</div>
                          <div style={{ height: 10, background: 'var(--surface-2)', borderRadius: 999, border: '1px solid var(--border)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.round((paidCount / ins.schedule.length) * 100)}%`,
                              height: '100%',
                              background: 'var(--primary)',
                              transition: 'width 200ms ease'
                            }} />
                          </div>
                        </div>

                        <div style={{ marginTop: 12 }}>
                          <div className="hint">Schedule</div>
                          <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>Due date</th>
                                  <th>Month</th>
                                  <th>Status</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {ins.schedule.map(s => (
                                  <tr key={`${s.year}-${s.monthIndex}`}>
                                    <td>{new Date(s.dueDate).toLocaleDateString()}</td>
                                    <td>{new Date(s.year, s.monthIndex, 1).toLocaleString(undefined, { month: 'short', year: 'numeric' })}</td>
                                    <td>{s.paid ? 'Paid' : 'Unpaid'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                      <div className="controls" style={{ justifyContent: 'flex-end' }}>
                                        <button className="button" onClick={() => toggleInstallmentPayment(ins.id, s.year, s.monthIndex, !s.paid)}>{s.paid ? 'Mark Unpaid' : 'Mark Paid'}</button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {endDate ? <div className="hint">Ends {new Date(endDate).toLocaleDateString()}</div> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


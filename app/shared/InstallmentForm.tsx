"use client";
import { useMemo, useState } from 'react';
import { useFinance } from '@lib/financeStore';
import { formatCurrency } from '@lib/currency';

export default function InstallmentForm() {
  const { addInstallment } = useFinance();
  const [itemName, setItemName] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [downPayment, setDownPayment] = useState<string>('');
  const [monthlyAmount, setMonthlyAmount] = useState<string>('');
  const [numberOfMonths, setNumberOfMonths] = useState<string>('12');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<string | null>(null);

  const parsed = useMemo(() => {
    const total = Number(totalAmount) || 0;
    const down = Number(downPayment) || 0;
    const monthly = Number(monthlyAmount) || 0;
    const months = Math.max(1, Number(numberOfMonths) || 1);
    const remain = Math.max(0, total - down);
    const end = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + months - 1, new Date(startDate).getDate());
    return { total, down, monthly, months, remain, endDate: end };
  }, [totalAmount, downPayment, monthlyAmount, numberOfMonths, startDate]);

  const isValid = useMemo(() => {
    return (
      itemName.trim().length > 0 &&
      parsed.total > 0 &&
      parsed.monthly > 0 &&
      parsed.months > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(startDate)
    );
  }, [itemName, parsed.total, parsed.monthly, parsed.months, startDate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setErrors('Please fill all required fields with valid numbers.');
      return;
    }
    addInstallment({
      itemName: itemName.trim(),
      totalAmount: parsed.total,
      downPayment: parsed.down || undefined,
      monthlyAmount: parsed.monthly,
      numberOfMonths: parsed.months,
      startDate: new Date(startDate).toISOString()
    });
    setItemName('');
    setTotalAmount('');
    setDownPayment('');
    setMonthlyAmount('');
    setNumberOfMonths('12');
    setStartDate(new Date().toISOString().slice(0, 10));
    setErrors(null);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="row">
        <div className="field">
          <label className="label">Item name</label>
          <input className="input" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., iPhone 15, Sofa" required />
        </div>
        <div className="field">
          <label className="label">Total amount</label>
          <input className="input" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="0.00" />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label className="label">Down payment (optional)</label>
          <input className="input" value={downPayment} onChange={(e) => setDownPayment(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="0.00" />
        </div>
        <div className="field">
          <label className="label">Monthly payment</label>
          <input className="input" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="0.00" />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label className="label">Number of months</label>
          <input className="input" value={numberOfMonths} onChange={(e) => setNumberOfMonths(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="12" />
        </div>
        <div className="field">
          <label className="label">Start date</label>
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
      </div>
      <div className="hint">
        Remaining balance now: {formatCurrency(parsed.remain)} · Ends {parsed.endDate.toLocaleDateString()}
      </div>
      {errors ? <div className="error">{errors}</div> : null}
      <div className="controls">
        <button className="button primary" type="submit">Add Installment</button>
      </div>
    </form>
  );
}


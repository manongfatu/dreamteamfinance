export type EntryType = "income" | "expense" | "bill" | "savings" | "investment" | "installment";

export interface Entry {
  id: string;
  title: string;
  amount: number;
  entryType: EntryType;
  category?: string;
  date: string; // ISO string
  notes?: string;
  // When true, indicates this entry is part of an installment schedule
  paid?: boolean;
}

export interface MonthData {
  monthIndex: number; // 0-11
  entries: Entry[];
}

export interface YearData {
  year: number;
  months: MonthData[];
  // Optional list of installment plans tracked across months
  installments?: Installment[];
}

export interface SummaryTotals {
  income: number;
  expenses: number;
  bills: number;
  savings: number;
  investments: number;
  installments: number;
  net: number; // income - (expenses + bills + savings + investments)
}

export interface InstallmentScheduleItem {
  year: number;
  monthIndex: number; // 0-11
  dueDate: string; // ISO date for the due day in this month
  paid: boolean;
  // Link to an auto-generated entry representing this month's payment
  entryId?: string;
}

export interface Installment {
  id: string;
  itemName: string;
  totalAmount: number;
  downPayment?: number;
  monthlyAmount: number;
  numberOfMonths: number;
  startDate: string; // ISO start date
  schedule: InstallmentScheduleItem[];
  createdAt: string; // ISO
}

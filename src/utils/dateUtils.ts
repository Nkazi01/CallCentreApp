import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export function getCurrentMonthRange() {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

export function isDateInMonth(date: string | Date, month: Date = new Date()): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return isWithinInterval(dateObj, { start: monthStart, end: monthEnd });
  } catch {
    return false;
  }
}

export function generateLeadNumber(): string {
  const year = new Date().getFullYear();
  const leads = JSON.parse(localStorage.getItem('iy-finance-leads') || '[]');
  const currentYearLeads = leads.filter((lead: any) => 
    lead.leadNumber?.startsWith(`LEAD-${year}-`)
  );
  const nextNumber = (currentYearLeads.length + 1).toString().padStart(4, '0');
  return `LEAD-${year}-${nextNumber}`;
}


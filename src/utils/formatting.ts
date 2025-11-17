import { format, parseISO } from 'date-fns';

export function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd MMM yyyy');
  } catch {
    return 'Invalid date';
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd MMM yyyy, HH:mm');
  } catch {
    return 'Invalid date';
  }
}

export function formatCurrency(amount: string): string {
  // Extract number from string like "R 4,500" or "R 850 per creditor..."
  const match = amount.match(/R\s*([\d,]+)/);
  if (match) {
    return `R ${parseInt(match[1].replace(/,/g, '')).toLocaleString('en-ZA')}`;
  }
  return amount;
}


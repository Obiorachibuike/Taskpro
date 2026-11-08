export const nowIso = () => new Date().toISOString();

export function localDateKey(value: Date | string = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDays(value: Date | string, amount: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function startOfWeek(value: Date = new Date()): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

export function daysInMonth(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  return [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: count }, (_, day) => localDateKey(new Date(year, month, day + 1))),
  ];
}

export function formatFriendlyDate(value: string | null): string {
  if (!value) return 'No due date';
  const date = new Date(`${value}T12:00:00`);
  const today = localDateKey();
  if (value === today) return 'Today';
  if (value === localDateKey(addDays(new Date(), 1))) return 'Tomorrow';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

export function isOverdue(dueDate: string | null, status: string, today = localDateKey()): boolean {
  return Boolean(dueDate && dueDate < today && status !== 'completed');
}

export function combineDateTime(date: string | null, time: string | null): Date | null {
  if (!date) return null;
  const value = new Date(`${date}T${time || '09:00'}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

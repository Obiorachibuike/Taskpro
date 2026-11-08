import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '..';
import type { Task, TaskFilters, TaskStats } from '../../types';
import { addDays, isOverdue, localDateKey, startOfWeek } from '../../utils/date';

const tasks = (state: RootState) => state.tasks.items;
export const selectAllTasks = tasks;
export const selectTaskById = (state: RootState, id: string) => state.tasks.items.find((task) => task.id === id);
export const selectTaskFilters = (state: RootState) => state.tasks.filters;
export const selectFilteredTasks = createSelector([tasks, selectTaskFilters], (items, filters): Task[] => filterAndSortTasks(items, filters));

export function filterAndSortTasks(items: Task[], filters: TaskFilters): Task[] {
  const query = filters.query?.trim().toLocaleLowerCase();
  const today = localDateKey();
  const priority = { urgent: 0, high: 1, medium: 2, low: 3 };
  return items.filter((task) => {
    if (task.deletedAt || (!filters.includeArchived && task.archived)) return false;
    if (query && !`${task.title}\n${task.description}\n${task.tags.join(' ')}`.toLocaleLowerCase().includes(query)) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.projectId && task.projectId !== filters.projectId) return false;
    if (filters.categoryId && task.categoryId !== filters.categoryId) return false;
    if (filters.due === 'today' && task.dueDate !== (filters.date ?? today)) return false;
    if (filters.due === 'date' && task.dueDate !== filters.date) return false;
    if (filters.due === 'upcoming' && (!task.dueDate || task.dueDate <= today || task.status === 'completed')) return false;
    if (filters.due === 'overdue' && !isOverdue(task.dueDate, task.status)) return false;
    if (filters.due === 'completed' && task.status !== 'completed') return false;
    return true;
  }).sort((a, b) => {
    if (filters.sort === 'priority') return priority[a.priority] - priority[b.priority] || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
    if (filters.sort === 'deadline') return (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31') || (a.dueTime ?? '').localeCompare(b.dueTime ?? '');
    if (filters.sort === 'position') return a.position - b.position;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export const selectTaskStats = createSelector([tasks], (items): TaskStats => calculateTaskStats(items));
export function calculateTaskStats(items: Task[], today = localDateKey()): TaskStats {
  const active = items.filter((task) => !task.deletedAt && !task.archived);
  const completed = active.filter((task) => task.status === 'completed').length;
  const week = startOfWeek(new Date(`${today}T12:00:00`));
  const weekly = Array.from({ length: 7 }, (_, index) => {
    const date = localDateKey(addDays(week, index));
    const due = active.filter((task) => task.dueDate === date);
    return { date, label: addDays(week, index).toLocaleDateString(undefined, { weekday: 'narrow' }), total: due.length, completed: due.filter((task) => task.status === 'completed' || task.completedAt?.startsWith(date)).length };
  });
  return {
    total: active.length, completed, pending: active.length - completed,
    overdue: active.filter((task) => isOverdue(task.dueDate, task.status, today)).length,
    today: active.filter((task) => task.dueDate === today).length,
    upcoming: active.filter((task) => task.dueDate && task.dueDate > today && task.status !== 'completed').length,
    completion: active.length ? Math.round((completed / active.length) * 100) : 0, weekly,
  };
}

import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'completed']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(100),
  description: z.string().max(1000).default(''),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1).max(40),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
  name: z.string().trim().min(1).max(100).optional(),
});

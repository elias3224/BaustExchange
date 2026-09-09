/**
 * @file Centralised Zod validation schemas. Keep them in sync with the
 * Prisma schema. Used by route handlers and server actions.
 */
import { z } from 'zod';

export const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  categoryId: z.string().min(1, 'Category is required'),
  condition: z.enum(['new', 'like_new', 'good', 'used', 'damaged']),
  transactionType: z.enum(['sell', 'exchange', 'give_away', 'sell_or_exchange']),
  price: z
    .number()
    .min(0, 'Price must be zero or more')
    .nullable()
    .optional()
    .or(z.literal('')),
  quantity: z
    .number()
    .min(1, 'Quantity must be at least 1')
    .nullable()
    .optional()
    .or(z.literal('')),
  exchangeFor: z.string().max(200).nullable().optional().or(z.literal('')),
  location: z.string().max(120).nullable().optional().or(z.literal('')),
  contactPreference: z.string().max(120).nullable().optional().or(z.literal('')),
});

export const createWantedSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().max(1000).nullable().optional().or(z.literal('')),
  budget: z
    .number()
    .min(0, 'Budget must be zero or more')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export const createRequestSchema = z.object({
  message: z.string().min(5, 'Message must be at least 5 characters').max(1000),
  offeredItem: z.string().max(200).nullable().optional().or(z.literal('')),
});

export const updateProfileSchema = z.object({
  department: z.string().max(80).nullable().optional().or(z.literal('')),
  studentId: z.string().max(40).nullable().optional().or(z.literal('')),
  phone: z.string().max(30).nullable().optional().or(z.literal('')),
  image: z.string().url('Invalid url').nullable().optional().or(z.literal('')),
  role: z.enum(['student', 'teacher']).optional(),
  isVerifiedSeller: z.boolean().optional(),
});

export const createReportSchema = z.object({
  listingId: z.string().min(1).nullable().optional(),
  reportedUserId: z.string().nullable().optional(),
  reason: z.string().min(2),
  description: z.string().max(1000).nullable().optional(),
});

export const sendMessageSchema = z.object({
  toUserId: z.string().min(1),
  listingId: z.string().nullable().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(1000),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Name too short').max(60),
  slug: z.string().min(2, 'Slug too short').max(60),
  enabled: z.boolean().optional(),
});

export const userUpdateSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin']).optional(),
  status: z.enum(['active', 'blocked']).optional(),
  department: z.string().max(80).nullable().optional().or(z.literal('')),
  studentId: z.string().max(40).nullable().optional().or(z.literal('')),
  phone: z.string().max(30).nullable().optional().or(z.literal('')),
});

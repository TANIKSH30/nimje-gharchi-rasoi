import { z } from 'zod';

export const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid 10-digit phone number'),
  address_line: z.string().min(5, 'Address line must be at least 5 characters'),
  area: z.string().min(2, 'Area is required'),
  city: z.string().min(2, 'City is required').default('Nagpur'),
  state: z.string().min(2, 'State is required').default('Maharashtra'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit PIN code'),
  landmark: z.string().optional().nullable(),
  is_default: z.boolean().default(false),
});

export const planSchema = z.object({
  name: z.string().min(3, 'Plan name is required'),
  description: z.string().optional().nullable(),
  plan_type: z.enum(['daily', 'weekly', 'monthly']),
  meal_type: z.enum(['full', 'half', 'morning', 'evening', 'both']),
  price: z.number().positive('Price must be greater than 0'),
  discounted_price: z.number().positive().optional().nullable(),
  duration_days: z.number().int().positive('Duration in days must be positive'),
  is_active: z.boolean().default(true),
});

export const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Invalid phone number').optional(),
});

export const createPaymentIntentSchema = z.object({
  plan_id: z.string().uuid().optional().nullable(),
  address_id: z.string().uuid(),
  delivery_time: z.enum(['morning', 'evening', 'both']).default('morning'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD start date required').optional().nullable(),
  order_type: z.enum(['subscription', 'special_order']).default('subscription'),
  special_instructions: z.string().max(500).optional().nullable(),
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).optional(),
});

export const submitUtrSchema = z.object({
  payment_id: z.string().uuid(),
  utr: z
    .string()
    .trim()
    .min(6, 'UTR / Transaction ID must be at least 6 characters')
    .max(30, 'UTR / Transaction ID is too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'UTR can only contain letters, numbers, and dashes'),
  plan_id: z.string().uuid().optional().nullable(),
  address_id: z.string().uuid().optional().nullable(),
  delivery_time: z.enum(['morning', 'evening', 'both']).optional().nullable(),
  special_instructions: z.string().max(500).optional().nullable(),
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.number().int().positive(),
    name: z.string().optional(),
    price: z.number().optional(),
  })).optional(),
});

export const adminVerifyPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().max(500).optional().nullable(),
});

export const businessSettingsSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  payee_name: z.string().min(2, 'Payee name is required'),
  upi_id: z.string().regex(/^[\w.-]+@[\w.-]+$/, 'Please enter a valid UPI ID (e.g. name@bank)'),
  payment_instructions: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  location: z.string().optional(),
  lunch_slot: z.string().optional(),
  dinner_slot: z.string().optional(),
});

export type UserRole = 'customer' | 'admin';

export type PlanType = 'daily' | 'weekly' | 'monthly';
export type MealType = 'full' | 'half' | 'morning' | 'evening' | 'both';
export type DeliveryTime = 'morning' | 'evening' | 'both';

export type SubscriptionStatus = 'pending' | 'active' | 'paused' | 'expired' | 'cancelled';
export type PaymentStatus = 'created' | 'pending' | 'pending_verification' | 'paid' | 'rejected' | 'failed' | 'cancelled' | 'refunded';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type OrderType = 'subscription_delivery' | 'special_order' | 'addon';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address_line: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  plan_type: PlanType;
  meal_type: MealType;
  price: number;
  discounted_price: number | null;
  duration_days: number;
  duration_unit?: string;
  available_timings?: string[];
  included_meals?: string | null;
  features?: string[];
  display_order?: number;
  is_featured?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SpecialOrderCategory =
  | 'roti'
  | 'veg'
  | 'non_veg'
  | 'rice_dal'
  | 'sweets'
  | 'bulk_party'
  | 'other';

export interface SpecialOrderProduct {
  id: string;
  name: string;
  description: string | null;
  category: SpecialOrderCategory;
  image_url: string | null;
  price: number;
  unit: string;
  pricing_unit_step: number;
  min_quantity: number;
  max_quantity: number;
  quantity_step: number;
  is_available: boolean;
  advance_notice_hours: number;
  allow_instructions?: boolean;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

export interface Addon {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  address_id: string | null;
  start_date: string;
  end_date: string;
  status: SubscriptionStatus;
  amount: number;
  payment_status: PaymentStatus;
  delivery_time: DeliveryTime;
  created_at: string;
  updated_at: string;
  // Joined fields
  plan?: Plan;
  address?: Address;
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  item_name: string;
  item_type: string;
  unit_snapshot?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  subscription_id: string | null;
  address_id: string | null;
  order_date: string;
  required_date?: string | null;
  preferred_time?: string | null;
  meal_type: string;
  order_type: OrderType;
  subtotal: number;
  addon_amount: number;
  total_amount: number;
  status: OrderStatus;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  order_items?: OrderItem[];
  address?: Address;
  profile?: Profile;
  subscription?: Subscription;
}

export interface Payment {
  id: string;
  user_id: string;
  order_id: string | null;
  subscription_id: string | null;
  payment_reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  utr: string | null;
  upi_id: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  // Historical fields (optional/nullable)
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  order?: Order;
  subscription?: Subscription;
  verifier?: Profile;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  payee_name: string;
  upi_id: string;
  payment_instructions: string;
  phone: string;
  email: string;
  location: string;
  lunch_slot: string;
  dinner_slot: string;
  updated_at: string;
}

export type NotificationType =
  | 'order_created'
  | 'order_confirmed'
  | 'order_cancelled'
  | 'order_preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'payment_verified'
  | 'general';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  order_id: string | null;
  is_read: boolean;
  created_at: string;
  // Joined fields
  order?: Order;
}

export interface NotificationLog {
  id: string;
  event_key: string; // e.g. "order_created:<order_id>"
  event_type: string;
  recipient: string;
  channel: 'email' | 'sms' | 'in_app';
  order_id: string | null;
  status: 'sent' | 'failed' | 'skipped' | 'queued';
  error_message: string | null;
  payload?: any;
  created_at: string;
}

import { supabase } from '@/lib/supabase/client';
import { SpecialOrderProduct, SpecialOrderCategory } from '@/types/database';

export const SPECIAL_ORDER_CATEGORIES: { id: SpecialOrderCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Delicacies' },
  { id: 'roti', label: 'Roti & Breads' },
  { id: 'veg', label: 'Veg Sabji' },
  { id: 'non_veg', label: 'Non-Veg Gravies' },
  { id: 'rice_dal', label: 'Rice & Dal' },
  { id: 'sweets', label: 'Sweets & Desserts' },
  { id: 'bulk_party', label: 'Bulk / Party Packs' },
  { id: 'other', label: 'Other' },
];

export async function fetchActiveSpecialOrderProducts(): Promise<SpecialOrderProduct[]> {
  const { data, error } = await supabase
    .from('special_order_products')
    .select('*')
    .eq('is_available', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching special order products:', error);
    throw error;
  }

  return (data as SpecialOrderProduct[]) || [];
}

export async function fetchAllSpecialOrderProductsAdmin(): Promise<SpecialOrderProduct[]> {
  const { data, error } = await supabase
    .from('special_order_products')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching admin special order products:', error);
    throw error;
  }

  return (data as SpecialOrderProduct[]) || [];
}

/**
 * Calculates price for a given quantity respecting pricing unit step.
 * e.g., if price is ₹120 for pricing_unit_step 10 pcs, 30 pcs = (30 / 10) * 120 = ₹360
 * e.g., if price is ₹480 for pricing_unit_step 1.0 kg, 1.5 kg = (1.5 / 1.0) * 480 = ₹720
 */
export function calculateItemLinePrice(
  price: number,
  pricingUnitStep: number,
  quantity: number
): number {
  const step = pricingUnitStep > 0 ? pricingUnitStep : 1;
  const rawTotal = (quantity / step) * price;
  return Math.round(rawTotal * 100) / 100;
}

/**
 * Format standard price & unit label (e.g. ₹120 / 10 pcs, ₹480 / 1 kg)
 */
export function formatPriceUnit(price: number, pricingUnitStep: number, unit: string): string {
  const stepText = pricingUnitStep > 1 ? `${pricingUnitStep} ` : '';
  return `₹${price} / ${stepText}${unit}`;
}

/**
 * Validates whether the requested quantity is valid according to product rules.
 */
export function validateQuantityRules(
  product: SpecialOrderProduct,
  quantity: number
): { isValid: boolean; error?: string } {
  if (isNaN(quantity) || quantity <= 0) {
    return { isValid: false, error: 'Please enter a valid positive quantity.' };
  }

  const min = Number(product.min_quantity) || 1;
  const max = Number(product.max_quantity) || 1000;
  const step = Number(product.quantity_step) || 1;

  if (quantity < min) {
    return {
      isValid: false,
      error: `Minimum order for ${product.name} is ${min} ${product.unit}.`,
    };
  }

  if (quantity > max) {
    return {
      isValid: false,
      error: `Maximum order for ${product.name} is ${max} ${product.unit}.`,
    };
  }

  // Check step multiple (allow tiny floating point inaccuracies)
  const stepsCount = (quantity - min) / step;
  const diffFromInteger = Math.abs(stepsCount - Math.round(stepsCount));
  if (diffFromInteger > 0.001) {
    return {
      isValid: false,
      error: `Quantity must be in steps of ${step} ${product.unit} (starting from ${min}).`,
    };
  }

  return { isValid: true };
}

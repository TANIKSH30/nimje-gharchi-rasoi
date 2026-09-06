import QRCode from 'qrcode';
import { supabase } from './supabase/client';

export interface UPIConfig {
  upiId: string;
  payeeName: string;
  businessName: string;
  paymentInstructions: string;
}

export const NIMJE_UPI_ID = 'tanikshnimje@okaxis';
export const NIMJE_PAYEE_NAME = 'Taniksh Nimje';

export const DEFAULT_UPI_CONFIG: UPIConfig = {
  upiId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NIMJE_UPI_ID) ||
    (typeof process !== 'undefined' && process.env?.NIMJE_UPI_ID) ||
    NIMJE_UPI_ID,
  payeeName:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NIMJE_PAYEE_NAME) ||
    (typeof process !== 'undefined' && process.env?.NIMJE_PAYEE_NAME) ||
    NIMJE_PAYEE_NAME,
  businessName: 'Nimje Gharchi Rasoi',
  paymentInstructions:
    'Scan the QR code using any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred, etc.). After completing the payment, enter your 12-digit UTR / Transaction ID below.',
};

/**
 * Retrieves dynamic business UPI settings from database or fallback defaults.
 */
export async function getBusinessUPIConfig(): Promise<UPIConfig> {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_UPI_CONFIG;
    }

    return {
      upiId: data.upi_id || DEFAULT_UPI_CONFIG.upiId,
      payeeName: data.payee_name || DEFAULT_UPI_CONFIG.payeeName,
      businessName: data.business_name || DEFAULT_UPI_CONFIG.businessName,
      paymentInstructions: data.payment_instructions || DEFAULT_UPI_CONFIG.paymentInstructions,
    };
  } catch (err) {
    console.error('Error loading business UPI config:', err);
    return DEFAULT_UPI_CONFIG;
  }
}

/**
 * Generates a standard NPCI compliant UPI Intent URI string.
 * Example: upi://pay?pa=tanikshnimje@okaxis&pn=Taniksh%20Nimje&am=3000.00&cu=INR&tn=NGR-20260831-000123
 */
export function buildUPIPaymentUrl(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  paymentReference: string;
}): string {
  const { upiId, payeeName, amount, paymentReference } = params;
  const formattedAmount = Number(amount).toFixed(2);
  const encodedName = encodeURIComponent(payeeName.trim());
  const encodedNote = encodeURIComponent(`NGR ${paymentReference}`);

  return `upi://pay?pa=${upiId.trim()}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;
}

/**
 * Generates a high-quality QR code data URL (PNG) from a UPI string.
 */
export async function generateUPIQRCode(upiUrl: string): Promise<string> {
  return QRCode.toDataURL(upiUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#18181b', // Zinc 900
      light: '#ffffff',
    },
  });
}

/**
 * Generates a high-quality SVG string for responsive rendering.
 */
export async function generateUPIQRCodeSVG(upiUrl: string): Promise<string> {
  return QRCode.toString(upiUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#18181b',
      light: '#ffffff',
    },
  });
}

/**
 * Generates a collision-resistant internal payment reference.
 * Example: NGR-20260831-482910
 */
export function generatePaymentReference(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `NGR-${today}-${randomSuffix}`;
}

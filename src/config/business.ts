/**
 * Centralized Business Configuration & Contact Helpers
 * Nimje Gharchi Rasoi - Homemade Tiffin/Mess Service in Nagpur
 */

export const BUSINESS_CONFIG = {
  name: 'Nimje Gharchi Rasoi',
  tagline: 'Authentic Homestyle Tiffin & Mess Service in Nagpur',
  description:
    'Fresh, hygienic, and authentic Maharashtrian & Vidarbha home-cooked tiffins delivered daily across Nagpur. Zero preservatives, 100% pure veg, prepared with mother’s care.',
  phone: '+91 78230 98970',
  rawPhone: '7823098970',
  phoneCountryCode: '+91',
  email: 'tanikshnimje@gmail.com',
  hubLocation: 'Nandanvan, Reshimbagh & Medical Square, Nagpur, Maharashtra - 440009',
  city: 'Nagpur',
  state: 'Maharashtra',
  country: 'India',
  operatingHours: {
    lunch: '11:30 AM – 2:00 PM',
    dinner: '7:30 PM – 10:00 PM',
  },
  deliveryAreas: [
    'Nandanvan',
    'Reshimbagh',
    'Medical Square',
    'Civil Lines',
    'Dharampeth',
    'Sadar',
    'Dhantoli',
    'Ramdaspeth',
    'Sitabuldi',
    'Manewada',
    'Ayodhya Nagar',
    'Sakkardara',
    'Besur',
    'Hudkeshwar',
  ],
  googleReviewUrl:
    'https://www.google.com/search?q=Nimje+Gharachi+Rasoi+Tiffin+services+Nagpur',
  siteUrl: 'https://nimje-gharchi-rasoi.vercel.app',
} as const;

/**
 * Returns a tel: link for direct dialing
 */
export function getPhoneCallUrl(): string {
  return `tel:+91${BUSINESS_CONFIG.rawPhone}`;
}

/**
 * Returns a wa.me URL with an optional customized message
 */
export function getWhatsAppUrl(
  customMessage: string = 'Hi Nimje Gharchi Rasoi, I would like to inquire about your daily tiffin & meal subscription plans in Nagpur.'
): string {
  const encoded = encodeURIComponent(customMessage);
  return `https://wa.me/91${BUSINESS_CONFIG.rawPhone}?text=${encoded}`;
}

/**
 * Returns a mailto: link
 */
export function getEmailMailtoUrl(subject: string = 'Inquiry for Nimje Gharchi Rasoi'): string {
  const encoded = encodeURIComponent(subject);
  return `mailto:${BUSINESS_CONFIG.email}?subject=${encoded}`;
}

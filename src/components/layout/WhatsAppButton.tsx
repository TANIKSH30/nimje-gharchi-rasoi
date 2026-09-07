import React from 'react';
import { MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '@/config/business';

export default function WhatsAppButton() {
  const whatsappUrl = getWhatsAppUrl(
    'Hi Nimje Gharchi Rasoi, I would like to know more about your homestyle daily tiffin plans in Nagpur.'
  );

  return (
    <aside aria-label="WhatsApp Support">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
        aria-label="Chat with Nimje Gharchi Rasoi on WhatsApp"
      >
        <MessageCircle size={26} className="fill-current" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out font-bold text-xs pl-0 group-hover:pl-2">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
}

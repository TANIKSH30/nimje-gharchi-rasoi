import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, Sparkles, ExternalLink, ShieldCheck, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const ACTIVE_DELIVERY_ZONES = [
  'Nandanvan',
  'Rajendra Nagar',
  'Venkatesh Nagar',
  'Darshan Colony',
  'Hiwari Nagar',
  'Indira Devi Town',
  'Mire Layout',
  'Bhande Plot',
  'Bapu Nagar',
  'Gurudev Nagar',
  'New Nandanvan',
  'Ganesh Nagar',
  'Nehru Nagar',
  'Hasanbag',
];

interface DeliveryZoneMapProps {
  className?: string;
  showTitle?: boolean;
}

export default function DeliveryZoneMap({ className = '', showTitle = false }: DeliveryZoneMapProps) {
  const [selectedZone, setSelectedZone] = useState<string>('Nandanvan');

  const mapQuery = selectedZone
    ? `${selectedZone}, Nagpur, Maharashtra, India`
    : 'Nandanvan, Nagpur, Maharashtra, India';

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl text-foreground flex items-center gap-2">
              <MapPin size={20} className="text-emerald-700" />
              <span>Active Nagpur Delivery Zones</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Select your area below to highlight and view delivery coverage on Google Maps.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>100% Free Doorstep Delivery</span>
          </div>
        </div>
      )}

      {/* Interactive Delivery Zone Selection Chips */}
      <div className="bg-white/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Navigation size={13} className="text-primary" /> Click Any Zone to Highlight on Map:
          </span>
          <span className="text-[11px] font-bold text-primary">
            Selected: <span className="underline">{selectedZone}</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-36 overflow-y-auto pr-1">
          {ACTIVE_DELIVERY_ZONES.map((zone) => {
            const isSelected = selectedZone === zone;
            return (
              <button
                key={zone}
                type="button"
                onClick={() => setSelectedZone(zone)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-900/20 scale-102 ring-2 ring-emerald-600/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200/80 border border-transparent'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-amber-400' : 'bg-gray-400'
                  }`}
                />
                <span>{zone}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Display Container with Floating Live Highlight Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-md bg-gray-100 h-[380px] sm:h-[440px]">
        {/* Floating Highlight Banner */}
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-amber-300 flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <MapPin size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-foreground">
                  {selectedZone}, Nagpur
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  Active Service Zone
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">
                Fresh lunch & dinner tiffin delivery active in this sector
              </p>
            </div>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors self-end sm:self-auto"
          >
            <span>Open in Google Maps</span>
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Embedded Dynamic Google Map */}
        <iframe
          key={mapQuery}
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Delivery Zone Map for ${selectedZone}`}
          className="w-full h-full"
        />

        {/* Bottom Coverage Tag */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#131714]/90 text-white backdrop-blur-md shadow-lg border border-white/10 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Serving 14+ Prime Colonies in East Nagpur</span>
          </span>
        </div>
      </div>
    </div>
  );
}

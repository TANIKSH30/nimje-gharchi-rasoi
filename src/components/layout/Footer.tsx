import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Heart, ShieldCheck, UtensilsCrossed } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#131714] text-zinc-300 pt-16 pb-8 border-t border-emerald-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-600 to-teal-800 text-amber-300 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-950/40 border border-emerald-500/30">
                <UtensilsCrossed size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl leading-tight text-white tracking-tight">
                  Nimje Gharchi Rasoi
                </span>
                <span className="text-[10px] font-extrabold text-amber-400 tracking-widest uppercase">
                  Nagpur • Homestyle Mess
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              20+ years of trust serving fresh, hygienic, authentic Vidarbha & Maharashtrian home-cooked tiffins delivered on-time across Nagpur.
            </p>
            
            {/* Google 5-Star Rating Badge */}
            <a
              href="https://www.google.com/search?q=Nimje+Gharachi+Rasoi+Tiffin+services+Nagpur"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all text-xs font-bold w-fit shadow-xs group"
              title="Rate Nimje Gharachi Rasoi on Google"
            >
              <span className="flex text-amber-400 text-sm">★★★★★</span>
              <span>5.0 on Google</span>
              <span className="text-[10px] text-amber-200 group-hover:translate-x-0.5 transition-transform">→</span>
            </a>

            <div className="flex items-center gap-2 text-xs text-emerald-300/90 bg-emerald-950/60 border border-emerald-800/40 px-3.5 py-2 rounded-2xl w-fit">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>100% Pure Veg • No Added Soda • Desi Flavors</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-extrabold text-sm mb-4 tracking-wide uppercase text-zinc-100">
              Quick Navigation
            </h3>
            <ul className="space-y-3 text-xs">
              <li>
                <Link to="/" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/plans" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                  Tiffin Subscription Plans
                </Link>
              </li>
              <li>
                <Link to="/special-orders" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                  Special Dishes & Add-ons
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                  Our 20-Year Heritage
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                  Delivery Areas & Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer & Orders */}
          <div>
            <h3 className="text-white font-extrabold text-sm mb-4 tracking-wide uppercase text-zinc-100">
              Patron Services
            </h3>
            <ul className="space-y-3 text-xs">
              <li>
                <Link to="/checkout" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
                  Order Tiffin Now →
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                  Customer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                  Track Deliveries
                </Link>
              </li>
              <li>
                <Link to="/payments" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                  Payment Ledger & Receipts
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                  Patron Login / Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-white font-extrabold text-sm mb-4 tracking-wide uppercase text-zinc-100">
              Nagpur Kitchen Hub
            </h3>
            <ul className="space-y-3.5 text-xs">
              <li className="flex items-start gap-2.5 text-zinc-400">
                <MapPin size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Near Reshimbagh / Civil Lines / Medical Square, Nagpur, Maharashtra</span>
              </li>
              <li className="flex items-center gap-2.5 text-zinc-400">
                <Phone size={16} className="text-emerald-400 shrink-0" />
                <a href="tel:+917823098970" className="hover:text-emerald-400 transition-colors font-mono">
                  +91 78230 98970
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-zinc-400">
                <Clock size={16} className="text-amber-400 shrink-0" />
                <span>Lunch: 11:30 AM – 2:00 PM<br />Dinner: 7:30 PM – 10:00 PM</span>
              </li>
              <li className="flex items-center gap-2.5 text-zinc-400">
                <Mail size={16} className="text-emerald-400 shrink-0" />
                <a href="mailto:tanikshnimje@gmail.com" className="hover:text-emerald-400 transition-colors">
                  tanikshnimje@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Nimje Gharchi Rasoi. Homestyle with love in Nagpur.</p>
          <div className="flex gap-4">
            <Link to="/contact" className="hover:text-zinc-300 transition-colors">Support</Link>
            <Link to="/about" className="hover:text-zinc-300 transition-colors">Quality Assurance</Link>
            <Link to="/plans" className="hover:text-zinc-300 transition-colors">Subscription Rates</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

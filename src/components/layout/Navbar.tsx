import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Shield,
  ShoppingBag,
  MapPin,
  CreditCard,
  Calendar,
  ChevronDown,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Tiffin Plans', path: '/plans' },
    { name: 'Special Orders', path: '/special-orders' },
    { name: 'Our Story', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled || location.pathname !== '/'
          ? 'bg-white/92 backdrop-blur-md shadow-xs border-b border-[#EAE6DE]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-amber-300 rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform border border-emerald-600/30">
              <UtensilsCrossed size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl leading-tight text-gray-900 tracking-tight">
                Nimje Gharchi Rasoi
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Nagpur • Authentic Mess
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#EAE6DE] shadow-xs">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-gray-700 hover:text-emerald-800 hover:bg-emerald-50/60'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* User Controls / Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <NotificationBell />

                {/* Profile Pill Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-gray-200 hover:border-emerald-500 bg-white transition-all shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                      {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-gray-800 max-w-[110px] truncate">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-3xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                      <div className="p-3 bg-[#FAF8F5] rounded-2xl mb-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Account</p>
                        <p className="font-bold text-gray-900 truncate mt-0.5">{user.email}</p>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800">
                            <Shield size={10} /> Administrator
                          </span>
                        )}
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-800 font-black hover:bg-emerald-50 transition-colors"
                        >
                          <Shield size={16} /> Admin Command Center
                        </Link>
                      )}

                      <Link
                        to="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <UserIcon size={15} className="text-gray-400" /> Customer Dashboard
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <ShoppingBag size={15} className="text-gray-400" /> My Tiffin Orders
                      </Link>

                      <Link
                        to="/subscriptions"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <Calendar size={15} className="text-gray-400" /> Subscriptions
                      </Link>

                      <Link
                        to="/payments"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <CreditCard size={15} className="text-gray-400" /> Payment History
                      </Link>

                      <Link
                        to="/addresses"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <MapPin size={15} className="text-gray-400" /> Delivery Addresses
                      </Link>

                      <div className="border-t border-gray-100 my-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors text-left"
                        >
                          <LogOut size={15} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Button asChild variant="ghost" size="sm" className="rounded-full text-xs font-bold text-gray-700 hover:text-emerald-800">
                  <Link to="/login">Sign In</Link>
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black px-5 shadow-md shadow-emerald-700/20"
                >
                  <Link to="/checkout" className="flex items-center gap-1.5">
                    <span>Order Tiffin</span>
                    <ArrowRight size={13} />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationBell />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle mobile menu"
              className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-700"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-3 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 rounded-2xl text-sm font-bold ${
                  location.pathname === link.path
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-purple-50 text-purple-900 text-xs font-black"
                  >
                    <Shield size={14} /> Admin Command Center
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-700/20"
                >
                  My Customer Portal
                </Link>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="rounded-2xl text-xs font-bold">
                  <Link to="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild className="rounded-2xl bg-emerald-700 text-white text-xs font-black">
                  <Link to="/checkout" onClick={() => setIsOpen(false)}>Order Now</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

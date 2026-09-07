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
  ArrowRight,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import NotificationBell from '@/components/notifications/NotificationBell';
import { BUSINESS_CONFIG, getPhoneCallUrl } from '@/config/business';

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

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsOpen(false);
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

  const userInitial = (
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    'U'
  ).toUpperCase();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'My Account';

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
        isScrolled || location.pathname !== '/'
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-[#EAE6DE]'
          : 'bg-white/80 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-xl"
            aria-label="Nimje Gharchi Rasoi Home"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-amber-300 rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform border border-emerald-600/30">
              <UtensilsCrossed size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl leading-tight text-gray-900 tracking-tight">
                {BUSINESS_CONFIG.name}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Nagpur • Authentic Mess
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#EAE6DE] shadow-xs"
          >
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
          </nav>

          {/* Desktop User Controls / Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-gray-200 hover:border-emerald-500 bg-white transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                      {userInitial}
                    </div>
                    <span className="text-xs font-bold text-gray-800 max-w-[120px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform duration-200 ${
                        isProfileOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                      <div className="p-3 bg-[#FAF8F5] rounded-2xl mb-1 border border-[#EFECE6]">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Signed in as</p>
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
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-purple-900 font-black hover:bg-purple-50 transition-colors"
                        >
                          <Shield size={15} className="text-purple-600" /> Admin Command Center
                        </Link>
                      )}

                      <Link
                        to="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                      >
                        <UserIcon size={15} className="text-gray-400" /> Customer Dashboard
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                      >
                        <ShoppingBag size={15} className="text-gray-400" /> My Tiffin Orders
                      </Link>

                      <Link
                        to="/subscriptions"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                      >
                        <Calendar size={15} className="text-gray-400" /> Subscriptions & Plans
                      </Link>

                      <Link
                        to="/addresses"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                      >
                        <MapPin size={15} className="text-gray-400" /> Delivery Addresses
                      </Link>

                      <Link
                        to="/payments"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                      >
                        <CreditCard size={15} className="text-gray-400" /> Payment History
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-gray-700 font-semibold hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                      >
                        <UserIcon size={15} className="text-gray-400" /> Account Profile
                      </Link>

                      <div className="border-t border-gray-100 my-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs font-bold text-gray-700 hover:text-emerald-800"
                >
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

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationBell />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 active:scale-95 transition-all"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-gray-200 px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top-4 duration-200 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {/* Mobile Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                </Link>
              );
            })}
          </div>

          {/* Quick Call & WhatsApp Action on Mobile */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <a
              href={getPhoneCallUrl()}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-gray-100 text-gray-800 text-xs font-bold active:bg-gray-200 transition-colors"
            >
              <Phone size={14} className="text-emerald-700" />
              <span>Call Kitchen</span>
            </a>
            <Link
              to="/checkout"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-700/20"
            >
              <span>Order Tiffin</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Authenticated User or Guest Area in Mobile */}
          <div className="pt-2 border-t border-gray-100">
            {user ? (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50/70 border border-emerald-100/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                      {userInitial}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-purple-200 text-purple-900 shrink-0">
                      Admin
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-100 text-purple-900"
                    >
                      <Shield size={14} /> Admin Command Center
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-gray-800 hover:bg-emerald-50"
                  >
                    <UserIcon size={14} className="text-emerald-700" /> Dashboard
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-gray-800 hover:bg-emerald-50"
                  >
                    <ShoppingBag size={14} className="text-emerald-700" /> My Orders
                  </Link>
                  <Link
                    to="/subscriptions"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-gray-800 hover:bg-emerald-50"
                  >
                    <Calendar size={14} className="text-emerald-700" /> Subscriptions
                  </Link>
                  <Link
                    to="/addresses"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-gray-800 hover:bg-emerald-50"
                  >
                    <MapPin size={14} className="text-emerald-700" /> Addresses
                  </Link>
                  <Link
                    to="/payments"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-gray-800 hover:bg-emerald-50"
                  >
                    <CreditCard size={14} className="text-emerald-700" /> Payments
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-gray-800 hover:bg-emerald-50"
                  >
                    <UserIcon size={14} className="text-emerald-700" /> Profile
                  </Link>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-colors mt-2 cursor-pointer"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="rounded-2xl text-xs font-bold h-11">
                  <Link to="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild className="rounded-2xl bg-emerald-700 text-white text-xs font-black h-11">
                  <Link to="/signup" onClick={() => setIsOpen(false)}>Create Account</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Address } from '@/types/database';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export default function AddressesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address_line: '',
    area: '',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '',
    landmark: '',
  });

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (err) throw err;
      setAddresses((data as Address[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/addresses');
      return;
    }
    if (user) {
      loadAddresses();
    }
  }, [user, authLoading, navigate]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          name: formData.name || profile?.full_name || 'Customer',
          phone: formData.phone || profile?.phone || '',
          address_line: formData.address_line,
          area: formData.area,
          city: formData.city || 'Nagpur',
          state: formData.state || 'Maharashtra',
          pincode: formData.pincode,
          landmark: formData.landmark || null,
          is_default: addresses.length === 0,
        })
        .select()
        .single();

      if (err) throw err;
      if (data) {
        setAddresses([data as Address, ...addresses]);
        setIsAddOpen(false);
        setFormData({
          name: '',
          phone: '',
          address_line: '',
          area: '',
          city: 'Nagpur',
          state: 'Maharashtra',
          pincode: '',
          landmark: '',
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    try {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      await loadAddresses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery address?')) return;
    try {
      await supabase.from('addresses').delete().eq('id', id);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF8] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-foreground mb-2"
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </Link>
              <h1 className="text-3xl font-black text-foreground">Delivery Addresses</h1>
              <p className="text-xs text-gray-500 mt-1">Manage where your daily meals should be delivered in Nagpur.</p>
            </div>
            <Button
              onClick={() => setIsAddOpen(true)}
              className="rounded-xl text-xs gap-1.5 shadow-md shadow-primary/20 font-bold"
            >
              <Plus size={14} /> Add New Address
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <Card className="p-12 text-center rounded-3xl border border-gray-200 bg-white">
              <MapPin size={36} className="text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-base text-foreground">No Delivery Addresses Found</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">Add your home or office address in Nagpur to receive tiffins.</p>
              <Button onClick={() => setIsAddOpen(true)} className="rounded-xl font-bold">
                <Plus size={14} className="mr-1" /> Add Address
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <Card
                  key={addr.id}
                  className={`rounded-3xl border p-6 flex flex-col justify-between transition-all bg-white shadow-xs ${
                    addr.is_default ? 'border-primary/50 bg-primary/5' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-sm text-foreground">{addr.name}</h3>
                      {addr.is_default ? (
                        <span className="text-[10px] font-bold bg-primary text-white px-2.5 py-0.5 rounded-full">
                          Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-[10px] font-bold text-gray-400 hover:text-primary transition-colors cursor-pointer"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {addr.address_line}, {addr.area}, {addr.city} - {addr.pincode}
                    </p>
                    {addr.landmark && (
                      <p className="text-[11px] text-gray-400 mt-1">Landmark: {addr.landmark}</p>
                    )}
                    <p className="text-xs text-primary font-semibold mt-2">Contact: {addr.phone}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 text-gray-400 hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10 cursor-pointer"
                      title="Delete Address"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Address Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Delivery Address">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              required
              placeholder="Recipient Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              required
              type="tel"
              placeholder="Mobile Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <Input
            required
            placeholder="Flat / Building / House No / Street"
            value={formData.address_line}
            onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              required
              placeholder="Area / Locality in Nagpur"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
            <Input
              required
              maxLength={6}
              placeholder="6-digit Pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            />
          </div>
          <Input
            placeholder="Landmark (Optional)"
            value={formData.landmark}
            onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
          />
          <Button type="submit" loading={saving} className="w-full rounded-xl font-bold">
            Save Address
          </Button>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}

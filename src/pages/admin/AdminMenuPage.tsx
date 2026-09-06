import React, { useEffect, useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  Sparkles,
  Calendar as CalendarIcon,
  RefreshCw,
  AlertCircle,
  Clock,
  IndianRupee,
  Eye,
  EyeOff,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  MenuItem,
} from '@/services/adminService';

export default function AdminMenuPage() {
  const { user } = useAuth();
  const [selectedDateTab, setSelectedDateTab] = useState<'today' | 'tomorrow' | 'upcoming'>('today');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    menu_date: new Date().toISOString().split('T')[0],
    meal_type: 'morning',
    dish_name: '',
    description: '',
    is_veg: true,
    price: 0,
    is_available: true,
    is_special: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const fetchMenu = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setLoading(true);
      const items = await getMenuItems();
      setMenuItems(items);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const openAddModal = (mealType: 'morning' | 'evening' | 'special' = 'morning') => {
    const targetDate = selectedDateTab === 'tomorrow' ? tomorrowStr : todayStr;
    setEditingItem(null);
    setFormData({
      menu_date: targetDate,
      meal_type: mealType,
      dish_name: '',
      description: '',
      is_veg: true,
      price: mealType === 'special' ? 150 : 0,
      is_available: true,
      is_special: mealType === 'special',
    });
    setModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      menu_date: item.menu_date,
      meal_type: item.meal_type,
      dish_name: item.dish_name,
      description: item.description || '',
      is_veg: item.is_veg,
      price: item.price || 0,
      is_available: item.is_available,
      is_special: item.is_special,
    });
    setModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dish_name?.trim()) {
      showToast('error', 'Please enter a dish name.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingItem?.id) {
        await updateMenuItem(editingItem.id, formData, user?.id);
        showToast('success', 'Menu dish updated successfully!');
      } else {
        await createMenuItem(formData as MenuItem, user?.id);
        showToast('success', 'New dish added to menu!');
      }
      setModalOpen(false);
      await fetchMenu();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save menu dish.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the menu?`)) return;
    try {
      await deleteMenuItem(id, user?.id);
      showToast('success', `Removed "${name}" from menu.`);
      await fetchMenu();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete dish.');
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await toggleMenuItemAvailability(id, !currentStatus, user?.id);
      setMenuItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_available: !currentStatus } : i))
      );
      showToast('success', `Availability updated to ${!currentStatus ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter items by selected tab
  const tabItems = menuItems.filter((item) => {
    if (selectedDateTab === 'today') return item.menu_date === todayStr;
    if (selectedDateTab === 'tomorrow') return item.menu_date === tomorrowStr;
    return item.menu_date > tomorrowStr;
  });

  const morningItems = tabItems.filter((i) => i.meal_type === 'morning');
  const eveningItems = tabItems.filter((i) => i.meal_type === 'evening');
  const specialItems = tabItems.filter((i) => i.meal_type === 'special' || i.is_special);

  return (
    <AdminLayout
      title="Mess Daily Menu Planner"
      subtitle="Configure daily Nagpur home-style breakfast, lunch, dinner & festive special delicacies"
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => openAddModal('morning')}
            size="sm"
            className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5"
          >
            <Plus size={15} />
            <span>Add Dish</span>
          </Button>

          <Button
            onClick={() => fetchMenu(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="rounded-xl text-xs font-bold gap-2 border-gray-200"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Toast alert feedback */}
        {toastMsg && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-red-50 border border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className={toastMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'} />
              <span>{toastMsg.text}</span>
            </div>
            <button onClick={() => setToastMsg(null)}>
              <XCircle size={14} className="text-gray-400" />
            </button>
          </div>
        )}

        {/* Date Tabs (Today, Tomorrow, Upcoming) */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs">
            <button
              onClick={() => setSelectedDateTab('today')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                selectedDateTab === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Today's Menu ({new Date(todayStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
            </button>

            <button
              onClick={() => setSelectedDateTab('tomorrow')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                selectedDateTab === 'tomorrow'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Tomorrow's Menu ({new Date(tomorrowStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
            </button>

            <button
              onClick={() => setSelectedDateTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                selectedDateTab === 'upcoming'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Upcoming Schedule
            </button>
          </div>
        </div>

        {/* 3 Columns: Morning Meals, Evening Meals, Specials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. MORNING MEALS */}
          <Card className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Sun size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-gray-900">🌅 Morning Meals</h3>
                    <p className="text-[11px] text-gray-500">Breakfast & Lunch slots</p>
                  </div>
                </div>
                <Button
                  onClick={() => openAddModal('morning')}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-bold rounded-xl border-amber-200 text-amber-900 hover:bg-amber-50"
                >
                  <Plus size={13} className="mr-1" /> Add
                </Button>
              </div>

              {morningItems.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-xs">
                  No dishes scheduled for this morning.
                </div>
              ) : (
                <div className="space-y-3">
                  {morningItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.is_available
                          ? 'bg-amber-50/30 border-amber-100 hover:border-amber-200'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" title="Veg" />
                            <h4 className="font-extrabold text-sm text-gray-900 truncate">
                              {item.dish_name}
                            </h4>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleAvailability(item.id!, item.is_available)}
                            title={item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              item.is_available
                                ? 'text-emerald-700 hover:bg-emerald-100'
                                : 'text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {item.is_available ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id!, item.dish_name)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 2. EVENING MEALS */}
          <Card className="rounded-3xl border border-indigo-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                    <Moon size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-gray-900">🌙 Evening Meals</h3>
                    <p className="text-[11px] text-gray-500">Dinner Tiffin slot</p>
                  </div>
                </div>
                <Button
                  onClick={() => openAddModal('evening')}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-bold rounded-xl border-indigo-200 text-indigo-900 hover:bg-indigo-50"
                >
                  <Plus size={13} className="mr-1" /> Add
                </Button>
              </div>

              {eveningItems.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-xs">
                  No dishes scheduled for this evening.
                </div>
              ) : (
                <div className="space-y-3">
                  {eveningItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.is_available
                          ? 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-200'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" title="Veg" />
                            <h4 className="font-extrabold text-sm text-gray-900 truncate">
                              {item.dish_name}
                            </h4>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleAvailability(item.id!, item.is_available)}
                            title={item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              item.is_available
                                ? 'text-emerald-700 hover:bg-emerald-100'
                                : 'text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {item.is_available ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id!, item.dish_name)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 3. SPECIAL DELICACIES & SWEETS */}
          <Card className="rounded-3xl border border-emerald-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-gray-900">🍛 Special Dishes</h3>
                    <p className="text-[11px] text-gray-500">Addon items & sweets</p>
                  </div>
                </div>
                <Button
                  onClick={() => openAddModal('special')}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-bold rounded-xl border-emerald-200 text-emerald-900 hover:bg-emerald-50"
                >
                  <Plus size={13} className="mr-1" /> Add
                </Button>
              </div>

              {specialItems.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-xs">
                  No special dishes added for this day.
                </div>
              ) : (
                <div className="space-y-3">
                  {specialItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.is_available
                          ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-200'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" title="Veg" />
                            <h4 className="font-extrabold text-sm text-gray-900 truncate">
                              {item.dish_name}
                            </h4>
                            {item.price ? (
                              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                                ₹{item.price}
                              </span>
                            ) : null}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleAvailability(item.id!, item.is_available)}
                            title={item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              item.is_available
                                ? 'text-emerald-700 hover:bg-emerald-100'
                                : 'text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {item.is_available ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id!, item.dish_name)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ADD / EDIT DISH MODAL */}
        <Modal
          isOpen={modalOpen}
          onClose={() => !formLoading && setModalOpen(false)}
          title={editingItem ? 'Edit Menu Dish' : 'Add Dish to Menu'}
        >
          <form onSubmit={handleSaveItem} className="space-y-4 text-left text-xs">
            {/* Date & Meal Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Date</label>
                <Input
                  type="date"
                  value={formData.menu_date}
                  onChange={(e) => setFormData({ ...formData, menu_date: e.target.value })}
                  required
                  className="rounded-xl text-xs h-9"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Meal Slot</label>
                <select
                  value={formData.meal_type}
                  onChange={(e) =>
                    setFormData({ ...formData, meal_type: e.target.value as any, is_special: e.target.value === 'special' })
                  }
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800 text-xs focus:ring-2 focus:ring-primary/20"
                >
                  <option value="morning">Morning (Breakfast / Lunch)</option>
                  <option value="evening">Evening (Dinner)</option>
                  <option value="special">Special Dish / Delicacy</option>
                </select>
              </div>
            </div>

            {/* Dish Name */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Dish Name *</label>
              <Input
                placeholder="e.g. Nagpuri Saoji Dal & Phulkas, Kande Pohe"
                value={formData.dish_name}
                onChange={(e) => setFormData({ ...formData, dish_name: e.target.value })}
                required
                className="rounded-xl text-xs"
              />
            </div>

            {/* Description */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Description (Ingredients / Sides)</label>
              <Input
                placeholder="e.g. Served with jeera rice, 4 whole wheat rotis & salad"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            {/* Price & Veg Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Extra Price (₹)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0 for subscription meal"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="rounded-xl text-xs h-9"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.is_veg}
                    onChange={(e) => setFormData({ ...formData, is_veg: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-gray-800">100% Pure Veg</span>
                </label>
              </div>
            </div>

            {/* Available Toggle */}
            <label className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-gray-800">Mark Available for Ordering</span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                onClick={() => setModalOpen(false)}
                variant="outline"
                disabled={formLoading}
                className="rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20"
              >
                {formLoading ? 'Saving...' : editingItem ? 'Update Dish' : 'Save Dish'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

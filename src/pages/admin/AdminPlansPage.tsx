import React, { useEffect, useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Calendar,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  Filter,
  ArrowUpDown,
  Star,
  Check,
  AlertTriangle,
  Clock,
  Layers,
  Users,
  TrendingUp,
  ChevronRight,
  X,
  SlidersHorizontal,
  Info,
  Archive,
  LayoutGrid,
  List,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Plan, PlanType, MealType } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAdminPlans,
  fetchAllPlansAnalytics,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deleteOrArchivePlan,
  checkPlanDependencies,
  PlanAnalytics,
  PlanDependencyCheck,
} from '@/services/planService';

const PRESET_FEATURES = [
  'Doorstep delivery included across Nagpur',
  'Freshly cooked homestyle nutritious meals',
  'Zero preservatives & pure ingredients',
  '4 Roti, Dal, Rice, 2 Sabji & Salad',
  'Pause & extend subscription on travel',
  'Sunday Special Sweet / Dish included',
  'Customizable spice levels & diet notes',
  'Warm insulated tiffin packaging',
];

export default function AdminPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, PlanAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('all');
  const [planTypeFilter, setPlanTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'display_order' | 'price_asc' | 'price_desc' | 'subscribers' | 'revenue' | 'name'>('display_order');

  // Modal / Drawer States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete / Archive Confirmation Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetPlanForDelete, setTargetPlanForDelete] = useState<Plan | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<PlanDependencyCheck | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan_type: 'monthly' as PlanType,
    meal_type: 'full' as MealType,
    price: 3000,
    discounted_price: 2800,
    duration_days: 30,
    duration_unit: 'days',
    included_meals: '4 Roti, Rice, Dal, 2 Sabji (1 Dry + 1 Gravy), Salad, Pickle',
    available_timings: ['morning', 'evening'],
    features: [] as string[],
    display_order: 1,
    is_featured: false,
    is_active: true,
  });

  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Load Data
  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const [plansData, analyticsData] = await Promise.all([
        fetchAdminPlans(),
        fetchAllPlansAnalytics(),
      ]);
      setPlans(plansData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      console.error('Error loading plans:', err);
      showToast(err.message || 'Failed to load meal plans', 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalPlans = plans.length;
    const activePlans = plans.filter((p) => p.is_active).length;
    const featuredPlans = plans.filter((p) => p.is_featured).length;
    const totalSubscribers = Object.values(analytics).reduce((acc, curr) => acc + curr.activeSubscribers, 0);
    const totalRevenue = Object.values(analytics).reduce((acc, curr) => acc + curr.totalRevenue, 0);

    return { totalPlans, activePlans, featuredPlans, totalSubscribers, totalRevenue };
  }, [plans, analytics]);

  // Filtered and Sorted Plans
  const filteredPlans = useMemo(() => {
    return plans
      .filter((plan) => {
        // Tab filter
        if (activeTab === 'active' && !plan.is_active) return false;
        if (activeTab === 'inactive' && plan.is_active) return false;
        if (activeTab === 'featured' && !plan.is_featured) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = plan.name.toLowerCase().includes(q);
          const matchDesc = plan.description?.toLowerCase().includes(q);
          const matchIncluded = plan.included_meals?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchIncluded) return false;
        }

        // Meal type filter
        if (mealTypeFilter !== 'all' && plan.meal_type !== mealTypeFilter) return false;

        // Plan type filter
        if (planTypeFilter !== 'all' && plan.plan_type !== planTypeFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'display_order') {
          return (a.display_order ?? 99) - (b.display_order ?? 99);
        }
        if (sortBy === 'price_asc') {
          const priceA = a.discounted_price || a.price;
          const priceB = b.discounted_price || b.price;
          return priceA - priceB;
        }
        if (sortBy === 'price_desc') {
          const priceA = a.discounted_price || a.price;
          const priceB = b.discounted_price || b.price;
          return priceB - priceA;
        }
        if (sortBy === 'subscribers') {
          const subsA = analytics[a.id]?.activeSubscribers || 0;
          const subsB = analytics[b.id]?.activeSubscribers || 0;
          return subsB - subsA;
        }
        if (sortBy === 'revenue') {
          const revA = analytics[a.id]?.totalRevenue || 0;
          const revB = analytics[b.id]?.totalRevenue || 0;
          return revB - revA;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [plans, analytics, activeTab, searchQuery, mealTypeFilter, planTypeFilter, sortBy]);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      plan_type: 'monthly',
      meal_type: 'full',
      price: 3000,
      discounted_price: 2800,
      duration_days: 30,
      duration_unit: 'days',
      included_meals: '4 Roti, Rice, Dal, 2 Sabji (1 Dry + 1 Gravy), Salad, Pickle',
      available_timings: ['morning', 'evening'],
      features: [
        '30 days uninterrupted doorstep delivery',
        'Maximum monthly savings & discounts',
        'Free Sunday Special Sweet included',
        'Pause & extend subscription anytime',
      ],
      display_order: plans.length + 1,
      is_featured: false,
      is_active: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      plan_type: plan.plan_type,
      meal_type: plan.meal_type,
      price: Number(plan.price),
      discounted_price: plan.discounted_price ? Number(plan.discounted_price) : 0,
      duration_days: plan.duration_days,
      duration_unit: plan.duration_unit || 'days',
      included_meals: plan.included_meals || '',
      available_timings: plan.available_timings && plan.available_timings.length > 0 ? plan.available_timings : ['morning', 'evening'],
      features: plan.features && plan.features.length > 0 ? plan.features : [],
      display_order: plan.display_order ?? 1,
      is_featured: Boolean(plan.is_featured),
      is_active: plan.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Add Feature to Checklist
  const handleAddFeature = (featureText?: string) => {
    const textToAdd = (featureText || newFeatureInput).trim();
    if (!textToAdd) return;
    if (formData.features.includes(textToAdd)) return;
    setFormData((prev) => ({ ...prev, features: [...prev.features, textToAdd] }));
    if (!featureText) setNewFeatureInput('');
  };

  // Remove Feature
  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Timing Toggle (Click morning / evening independently or both)
  const handleToggleTiming = (timing: 'morning' | 'evening') => {
    setFormData((prev) => {
      const isSelected = prev.available_timings.includes(timing);
      let updated: string[];
      if (isSelected) {
        // Toggle off if both are active, else keep at least one
        updated = prev.available_timings.filter((t) => t !== timing);
        if (updated.length === 0) {
          updated = [timing];
        }
      } else {
        // Add timing -> both selected!
        updated = [...prev.available_timings, timing];
      }
      return { ...prev, available_timings: updated };
    });
  };

  const handleSelectBothTimings = () => {
    setFormData((prev) => ({
      ...prev,
      available_timings: ['morning', 'evening'],
    }));
  };

  // Save Plan (Create / Update)
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      // Validate
      if (!formData.name.trim()) {
        throw new Error('Please provide a Plan Name.');
      }
      if (formData.price < 0) {
        throw new Error('Price cannot be negative.');
      }
      if (formData.discounted_price > 0 && formData.discounted_price > formData.price) {
        throw new Error('Discounted selling price should be less than or equal to original price.');
      }
      if (formData.duration_days <= 0) {
        throw new Error('Duration must be greater than 0.');
      }

      // Check duplicate plan name
      const isDuplicate = plans.some(
        (p) => p.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && p.id !== editingPlan?.id
      );
      if (isDuplicate) {
        throw new Error('A meal plan with this name already exists. Please use a unique title.');
      }

      if (editingPlan) {
        await updatePlan(editingPlan.id, formData, user?.id);
        showToast(`Plan "${formData.name}" successfully updated!`, 'success');
      } else {
        await createPlan(formData, user?.id);
        showToast(`Plan "${formData.name}" successfully created!`, 'success');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save meal plan.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Active Status
  const handleQuickToggleActive = async (plan: Plan) => {
    try {
      const newStatus = !plan.is_active;
      await togglePlanStatus(plan.id, newStatus, user?.id);
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_active: newStatus } : p))
      );
      showToast(
        newStatus ? `"${plan.name}" is now Active on website` : `"${plan.name}" has been Archived/Disabled`,
        'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update plan status', 'error');
    }
  };

  // Open Delete / Archive Confirmation
  const handleInitiateDelete = async (plan: Plan) => {
    setTargetPlanForDelete(plan);
    setDependencyInfo(null);
    setDeleteModalOpen(true);
    try {
      const check = await checkPlanDependencies(plan.id);
      setDependencyInfo(check);
    } catch (err) {
      console.error(err);
    }
  };

  // Confirm Delete / Archive Action
  const handleConfirmDelete = async () => {
    if (!targetPlanForDelete) return;
    setDeleting(true);
    try {
      const res = await deleteOrArchivePlan(targetPlanForDelete.id, user?.id);
      showToast(res.message, res.action === 'archived' ? 'info' : 'success');
      setDeleteModalOpen(false);
      setTargetPlanForDelete(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete/archive plan', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Subscription Plans & Tier Management"
      subtitle="Full control over customer subscription packages, pricing, meal cycles, features, and real-time database sync"
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5 px-3.5"
          >
            <Plus size={15} />
            <span>Create New Plan</span>
          </Button>

          <Button
            onClick={() => loadData(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="rounded-xl text-xs font-bold gap-2 border-gray-200 bg-white"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      }
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : toast.type === 'info'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <XCircle size={17} className="text-red-600" />
            ) : toast.type === 'info' ? (
              <AlertTriangle size={17} className="text-amber-600" />
            ) : (
              <CheckCircle2 size={17} className="text-emerald-600" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-700">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* TOP SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-3xl p-5 border border-gray-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Total Tiers</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Layers size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.totalPlans}</span>
              <span className="text-[11px] font-bold text-emerald-700">
                ({metrics.activePlans} Live)
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">Configured meal subscriptions</p>
          </Card>

          <Card className="rounded-3xl p-5 border border-gray-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Active Subscribers</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.totalSubscribers}</span>
              <span className="text-[11px] font-bold text-blue-600">Enrolled Now</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">Across all active plans</p>
          </Card>

          <Card className="rounded-3xl p-5 border border-gray-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Verified Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <IndianRupee size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-gray-900">
                ₹{metrics.totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">Real verified subscription payments</p>
          </Card>

          <Card className="rounded-3xl p-5 border border-gray-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Featured Packages</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.featuredPlans}</span>
              <span className="text-[11px] font-bold text-purple-600">Highlighted</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">Prominently shown to users</p>
          </Card>
        </div>

        {/* CONTROLS BAR: TABS, SEARCH, FILTERS & VIEW MODE */}
        <Card className="rounded-3xl border border-gray-200/80 bg-white p-4 shadow-xs space-y-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100/80 border border-gray-200/60 overflow-x-auto">
              {[
                { id: 'all', label: 'All Plans', count: plans.length },
                { id: 'active', label: 'Active on Site', count: plans.filter((p) => p.is_active).length },
                { id: 'inactive', label: 'Archived / Disabled', count: plans.filter((p) => !p.is_active).length },
                { id: 'featured', label: 'Featured', count: plans.filter((p) => p.is_featured).length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-emerald-950 shadow-xs border border-gray-200/80'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      activeTab === tab.id ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* View Mode Switch */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Table View"
              >
                <List size={15} />
              </button>
            </div>
          </div>

          {/* Search and Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search plan name, items, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-2xl border-gray-200 bg-gray-50/50 text-xs font-medium focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Meal Type Filter */}
            <div>
              <select
                value={mealTypeFilter}
                onChange={(e) => setMealTypeFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-xs font-bold text-gray-700 focus:bg-white"
              >
                <option value="all">All Meal Portions</option>
                <option value="full">Full Meal (4 Roti + 2 Sabji)</option>
                <option value="half">Half Meal (3 Roti + 1 Sabji)</option>
                <option value="morning">Morning Lunch Only</option>
                <option value="evening">Evening Dinner Only</option>
              </select>
            </div>

            {/* Plan Cycle Filter */}
            <div>
              <select
                value={planTypeFilter}
                onChange={(e) => setPlanTypeFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-xs font-bold text-gray-700 focus:bg-white"
              >
                <option value="all">All Durations</option>
                <option value="monthly">Monthly (30 Days)</option>
                <option value="weekly">Weekly (7 Days)</option>
                <option value="daily">Daily Tiffin (1 Day)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-10 px-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-xs font-bold text-gray-700 focus:bg-white"
              >
                <option value="display_order">Sort: Display Order</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="subscribers">Most Active Subscribers</option>
                <option value="revenue">Highest Revenue</option>
                <option value="name">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* MAIN LIST: GRID OR TABLE */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-80 rounded-3xl bg-gray-200/70 animate-pulse border border-gray-200/80"
              />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card className="rounded-3xl border border-gray-200 bg-white p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <UtensilsCrossed size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">No Meal Plans Found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                {searchQuery || mealTypeFilter !== 'all' || planTypeFilter !== 'all' || activeTab !== 'all'
                  ? 'No meal plans match your active search and filter criteria. Try resetting filters.'
                  : 'Get started by creating your first meal subscription tier for customer bookings.'}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              {(searchQuery || mealTypeFilter !== 'all' || planTypeFilter !== 'all' || activeTab !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setMealTypeFilter('all');
                    setPlanTypeFilter('all');
                    setActiveTab('all');
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                >
                  Reset Filters
                </Button>
              )}
              <Button
                onClick={handleOpenAdd}
                size="sm"
                className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus size={14} className="mr-1" />
                <span>Create Plan</span>
              </Button>
            </div>
          </Card>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const planStat = analytics[plan.id] || {
                activeSubscribers: 0,
                totalSubscriptions: 0,
                totalOrders: 0,
                totalRevenue: 0,
                popularityScore: 0,
              };

              const currentPrice = plan.discounted_price ? Number(plan.discounted_price) : Number(plan.price);
              const originalPrice = plan.discounted_price ? Number(plan.price) : null;

              return (
                <motion.div
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex"
                >
                  <Card
                    className={`relative rounded-3xl border p-6 flex flex-col justify-between w-full transition-all duration-200 shadow-xs hover:shadow-md ${
                      plan.is_active
                        ? 'bg-white border-gray-200/90'
                        : 'bg-gray-50/80 border-gray-300/70 opacity-75'
                    }`}
                  >
                    {/* Top Badges */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
                            {plan.plan_type} • {plan.duration_days} {plan.duration_unit || 'Days'}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                            #{plan.display_order ?? 0} Order
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {plan.is_featured && (
                            <span className="flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300/60 shadow-xs">
                              <Star size={11} className="fill-amber-600 text-amber-600" />
                              <span>Featured</span>
                            </span>
                          )}
                          <Badge
                            className={
                              plan.is_active
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300/60'
                                : 'bg-gray-200 text-gray-700'
                            }
                          >
                            {plan.is_active ? 'Active' : 'Archived'}
                          </Badge>
                        </div>
                      </div>

                      {/* Plan Title & Meal Portion */}
                      <h3 className="font-extrabold text-lg text-gray-900 leading-snug">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                          {plan.description}
                        </p>
                      )}

                      {/* Included Items Box */}
                      {plan.included_meals && (
                        <div className="mt-3 p-3 rounded-2xl bg-[#F8F6F0] border border-[#EAE3D2] text-[11px] text-gray-700 space-y-1">
                          <div className="font-black text-[10px] uppercase tracking-wider text-amber-900 flex items-center gap-1">
                            <UtensilsCrossed size={12} />
                            <span>Included Items:</span>
                          </div>
                          <p className="font-semibold text-gray-800">{plan.included_meals}</p>
                        </div>
                      )}

                      {/* Price Section */}
                      <div className="my-4 pt-3 border-t border-gray-100 flex items-baseline justify-between">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                              ₹{currentPrice}
                            </span>
                            {originalPrice && (
                              <span className="text-xs text-gray-400 line-through font-bold">
                                ₹{originalPrice}
                              </span>
                            )}
                            <span className="text-[11px] text-gray-500 font-semibold">
                              / {plan.plan_type === 'monthly' ? 'month' : plan.plan_type === 'weekly' ? 'week' : 'meal'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                            ~₹{Math.round(currentPrice / plan.duration_days)}/day effective rate
                          </p>
                        </div>

                        {/* Portion & Timing Tag */}
                        <div className="text-right text-[10px] font-bold text-gray-500 space-y-0.5">
                          <div className="capitalize bg-gray-100 px-2 py-0.5 rounded-md text-gray-700 inline-block font-extrabold">
                            {plan.meal_type} Meal
                          </div>
                          {plan.available_timings && plan.available_timings.length > 0 && (
                            <div className="text-[9px] text-gray-400">
                              {plan.available_timings.join(' & ')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Real Plan Analytics Row */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-gray-50/90 border border-gray-200/70 text-center mb-4">
                        <div>
                          <div className="text-[10px] font-black uppercase text-gray-400">Active Subs</div>
                          <div className="text-sm font-black text-blue-700">
                            {planStat.activeSubscribers}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-gray-400">Total Orders</div>
                          <div className="text-sm font-black text-gray-800">
                            {planStat.totalOrders}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-gray-400">Revenue</div>
                          <div className="text-sm font-black text-emerald-700">
                            ₹{planStat.totalRevenue.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Feature Bullets Preview */}
                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-1.5 mb-4">
                          {plan.features.slice(0, 3).map((feat, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
                              <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{feat}</span>
                            </div>
                          ))}
                          {plan.features.length > 3 && (
                            <p className="text-[10px] text-gray-400 font-bold pl-5">
                              +{plan.features.length - 3} more features
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleQuickToggleActive(plan)}
                        className={`text-xs font-black flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                          plan.is_active
                            ? 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50'
                        }`}
                        title={plan.is_active ? 'Disable plan from website' : 'Enable plan on website'}
                      >
                        {plan.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span>{plan.is_active ? 'Deactivate' : 'Publish'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          onClick={() => handleOpenEdit(plan)}
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl text-xs font-bold gap-1 border-gray-200 hover:border-gray-300 bg-white"
                        >
                          <Edit3 size={13} className="text-gray-600" />
                          <span>Edit</span>
                        </Button>

                        <button
                          onClick={() => handleInitiateDelete(plan)}
                          className="w-8 h-8 rounded-xl border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                          title="Delete or Archive Plan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <Card className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-3.5 px-4">Display #</th>
                    <th className="py-3.5 px-4">Plan Name & Details</th>
                    <th className="py-3.5 px-4">Duration & Meal</th>
                    <th className="py-3.5 px-4">Selling Price</th>
                    <th className="py-3.5 px-4 text-center">Subscribers</th>
                    <th className="py-3.5 px-4 text-center">Revenue</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPlans.map((plan) => {
                    const planStat = analytics[plan.id] || {
                      activeSubscribers: 0,
                      totalSubscriptions: 0,
                      totalOrders: 0,
                      totalRevenue: 0,
                      popularityScore: 0,
                    };
                    const price = plan.discounted_price || plan.price;

                    return (
                      <tr
                        key={plan.id}
                        className={`hover:bg-gray-50/70 transition-colors ${
                          !plan.is_active ? 'bg-gray-50/40 opacity-70' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-black text-gray-500">
                          #{plan.display_order ?? 0}
                        </td>
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 text-sm">{plan.name}</span>
                            {plan.is_featured && (
                              <Star size={12} className="fill-amber-500 text-amber-500 shrink-0" />
                            )}
                          </div>
                          {plan.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-1">{plan.description}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-gray-800 capitalize">
                            {plan.plan_type} ({plan.duration_days}d)
                          </span>
                          <span className="block text-[10px] text-gray-400 capitalize">
                            {plan.meal_type} Portion
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-black text-emerald-700 text-sm">₹{price}</span>
                          {plan.discounted_price && (
                            <span className="text-[10px] text-gray-400 line-through ml-1.5">
                              ₹{plan.price}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="font-black text-blue-700">{planStat.activeSubscribers}</span>
                          <span className="text-[10px] text-gray-400 block font-medium">
                            {planStat.totalSubscriptions} total
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-black text-gray-800">
                          ₹{planStat.totalRevenue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Badge
                            className={
                              plan.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-200 text-gray-700'
                            }
                          >
                            {plan.is_active ? 'Active' : 'Archived'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleQuickToggleActive(plan)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                              title={plan.is_active ? 'Deactivate' : 'Publish'}
                            >
                              {plan.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(plan)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold"
                              title="Edit Plan"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleInitiateDelete(plan)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete/Archive"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* MODAL / DRAWER FOR CREATE & EDIT PLAN */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => !saving && setIsModalOpen(false)}
          title={editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Subscription Meal Plan'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSavePlan} className="space-y-4 text-left text-xs">
            {formError && (
              <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 font-bold border border-red-200 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="font-extrabold text-gray-800 block mb-1">
                  Plan Name * <span className="text-gray-400 font-normal">(Customer Visible)</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Full Monthly Homestyle Tiffin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl text-xs h-10 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-extrabold text-gray-800 block mb-1">Description</label>
                <Input
                  placeholder="e.g. 30 days complete nutritional lunch & dinner subscription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl text-xs h-10"
                />
              </div>
            </div>

            {/* Included Meals Specification */}
            <div>
              <label className="font-extrabold text-gray-800 block mb-1">
                Included Meals / Menu Contents
              </label>
              <Input
                placeholder="e.g. 4 Roti, Rice, Dal, 2 Sabji (1 Dry + 1 Gravy), Salad, Pickle & Sunday Sweet"
                value={formData.included_meals}
                onChange={(e) => setFormData({ ...formData, included_meals: e.target.value })}
                className="rounded-xl text-xs h-10"
              />
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <div>
                <label className="font-extrabold text-emerald-950 block mb-1">Original Price (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="rounded-xl text-xs h-10 font-black bg-white"
                  placeholder="e.g. 3300"
                />
              </div>

              <div>
                <label className="font-extrabold text-emerald-950 block mb-1">
                  Selling / Discounted Price (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.discounted_price}
                  onChange={(e) => setFormData({ ...formData, discounted_price: Number(e.target.value) })}
                  className="rounded-xl text-xs h-10 font-black text-emerald-700 bg-white"
                  placeholder="e.g. 3000 (charged at checkout)"
                />
              </div>
            </div>

            {/* Duration and Cycle */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-extrabold text-gray-800 block mb-1">Plan Cycle</label>
                <select
                  value={formData.plan_type}
                  onChange={(e) => setFormData({ ...formData, plan_type: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white font-bold text-xs text-gray-800"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div>
                <label className="font-extrabold text-gray-800 block mb-1">Duration (Days) *</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                  className="rounded-xl text-xs h-10 font-bold"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="font-extrabold text-gray-800 block mb-1">Meal Portion</label>
                <select
                  value={formData.meal_type}
                  onChange={(e) => {
                    const newMealType = e.target.value as MealType;
                    setFormData((prev) => ({
                      ...prev,
                      meal_type: newMealType,
                      included_meals:
                        prev.included_meals === '' || prev.included_meals.includes('Roti')
                          ? newMealType === 'full'
                            ? '4 Roti, Rice, Dal, 2 Sabji (1 Dry + 1 Gravy), Salad, Pickle'
                            : newMealType === 'half'
                            ? '3 Roti, Rice, Dal, 1 Sabji, Salad & Pickle'
                            : newMealType === 'morning'
                            ? '4 Roti, Rice, Dal, 2 Sabji & Salad (Lunch)'
                            : newMealType === 'evening'
                            ? '4 Roti, Rice, Dal, 2 Sabji & Salad (Dinner)'
                            : '4 Roti, Rice, Dal, 2 Sabji (Both Lunch & Dinner)'
                          : prev.included_meals,
                    }));
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white font-bold text-xs text-gray-800 cursor-pointer hover:border-gray-300"
                >
                  <option value="full">Full Meal (4 Roti + 2 Sabji)</option>
                  <option value="half">Half Meal (3 Roti + 1 Sabji)</option>
                  <option value="both">Both Lunch & Dinner</option>
                  <option value="morning">Morning Lunch Only</option>
                  <option value="evening">Evening Dinner Only</option>
                </select>
              </div>
            </div>

            {/* Quick Meal Portion Chips */}
            <div>
              <label className="font-extrabold text-gray-700 block mb-1 text-[11px]">
                Quick Portion Selection
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'full', label: 'Full Portion (4 Roti)' },
                  { value: 'half', label: 'Half Portion (3 Roti)' },
                  { value: 'both', label: 'Both Slots (Full Day)' },
                  { value: 'morning', label: 'Lunch Only' },
                  { value: 'evening', label: 'Dinner Only' },
                ].map((portion) => (
                  <button
                    key={portion.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        meal_type: portion.value as MealType,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      formData.meal_type === portion.value
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {portion.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Timings */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-gray-800 block text-xs">
                  Available Timings (Select one or both)
                </label>
                <button
                  type="button"
                  onClick={handleSelectBothTimings}
                  className="text-[10px] font-black text-emerald-700 hover:underline cursor-pointer"
                >
                  Select Both Timings
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Morning Lunch Button */}
                <button
                  type="button"
                  onClick={() => handleToggleTiming('morning')}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    formData.available_timings.includes('morning')
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      formData.available_timings.includes('morning')
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {formData.available_timings.includes('morning') && (
                      <Check size={12} className="stroke-[3]" />
                    )}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block">Morning Lunch</span>
                    <span className="text-[10px] text-gray-400 font-medium">11:30 AM – 1:30 PM</span>
                  </div>
                </button>

                {/* Evening Dinner Button */}
                <button
                  type="button"
                  onClick={() => handleToggleTiming('evening')}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    formData.available_timings.includes('evening')
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      formData.available_timings.includes('evening')
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {formData.available_timings.includes('evening') && (
                      <Check size={12} className="stroke-[3]" />
                    )}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block">Evening Dinner</span>
                    <span className="text-[10px] text-gray-400 font-medium">7:30 PM – 9:30 PM</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Features Builder */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-gray-800 block">
                  Features & Highlights Checklist
                </label>
                <span className="text-[10px] text-gray-500 font-bold">
                  {formData.features.length} added
                </span>
              </div>

              {/* Added Features List */}
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {formData.features.map((feat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-gray-200 text-[11px] font-medium text-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="text-gray-400 hover:text-red-600 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Feature Input */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="Type new highlight (e.g. Free delivery included)..."
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="rounded-xl text-xs h-9 bg-white"
                />
                <Button
                  type="button"
                  onClick={() => handleAddFeature()}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold shrink-0 h-9"
                >
                  <Plus size={13} className="mr-1" />
                  <span>Add</span>
                </Button>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-gray-200/60">
                <p className="text-[10px] font-extrabold uppercase text-gray-400 mb-1.5">
                  Quick Suggestion Presets (Click to add)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_FEATURES.filter((p) => !formData.features.includes(p)).map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddFeature(preset)}
                      className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 text-[10px] text-gray-600 font-medium transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Order & Visibility Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="font-extrabold text-gray-800 block mb-1">Display Order</label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  className="rounded-xl text-xs h-9 font-bold"
                  placeholder="e.g. 1"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 pt-4">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 flex-1">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-gray-800 text-[11px]">Mark as Featured Plan</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 flex-1">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-gray-800 text-[11px]">Active (Visible to Users)</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <Button
                type="button"
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                disabled={saving}
                className="rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 px-4"
              >
                {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Publish Plan'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* DELETE / ARCHIVE CONFIRMATION MODAL */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => !deleting && setDeleteModalOpen(false)}
          title="Plan Archival / Deletion"
        >
          <div className="space-y-4 text-xs text-left">
            {targetPlanForDelete && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                  <ShieldAlert size={18} className="text-amber-600 shrink-0" />
                  <span>{targetPlanForDelete.name}</span>
                </div>
                <p className="text-amber-800 font-medium">
                  {dependencyInfo ? (
                    dependencyInfo.canHardDelete ? (
                      'This plan has no active subscriptions or payment history. It can be safely and permanently removed.'
                    ) : (
                      dependencyInfo.reason
                    )
                  ) : (
                    'Checking database dependencies and payment history...'
                  )}
                </p>
              </div>
            )}

            <div className="text-gray-600 space-y-2 leading-relaxed">
              <p>
                <strong>Payment Safety Guarantee:</strong> Changing or archiving a plan never affects historical payments or completed deliveries. Past orders and receipts will always preserve their original amounts.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                variant="outline"
                disabled={deleting}
                className="rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className={`rounded-xl text-white font-black text-xs shadow-md ${
                  dependencyInfo?.canHardDelete
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                }`}
              >
                {deleting
                  ? 'Processing...'
                  : dependencyInfo?.canHardDelete
                  ? 'Permanently Delete Plan'
                  : 'Safely Archive & Deactivate'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

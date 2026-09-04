import React, { useState, useEffect, useCallback } from 'react';
import { NotificationItem, NotificationCategory } from '../types/index.ts';
import { api } from '../services/api.ts';
import { Navbar } from '../components/Navbar.tsx';
import { NotificationBanner } from '../components/NotificationBanner.tsx';
import { NotificationCard } from '../components/NotificationCard.tsx';
import { CreateNotificationModal } from '../components/CreateNotificationModal.tsx';
import { EditNotificationModal } from '../components/EditNotificationModal.tsx';
import { RemediationModal } from '../components/RemediationModal.tsx';
import { AiDigestModal } from '../components/AiDigestModal.tsx';
import {
  Bell,
  Search,
  Filter,
  Plus,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  Info,
  Layers,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | NotificationCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISMISSED'>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NotificationItem | null>(null);
  const [remediatingItem, setRemediatingItem] = useState<NotificationItem | null>(null);
  const [isDigestOpen, setIsDigestOpen] = useState(false);

  // Fetch notifications
  const loadNotifications = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await api.notifications.getAll();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Auto poll every 10 seconds to sync real-time changes and auto-closed INFO alerts
    const interval = setInterval(() => {
      loadNotifications(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Real-time Banners logic conforming strictly to requirement:
  // "The most recent notifications (up to 5) appear as dismissible banners at the top of the dashboard.
  // If there are more than 5 undismissed notifications, a summary banner is shown instead ('You have more notifications')."
  const undismissedNotifications = notifications.filter(n => !n.isDismissed);
  const showSummaryBanner = undismissedNotifications.length > 5;
  const topBanners = showSummaryBanner ? [] : undismissedNotifications.slice(0, 5);

  // Handlers
  const handleDismiss = async (id: string) => {
    // Optimistic UI update immediately
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isDismissed: true, dismissedAt: new Date().toISOString() } : n))
    );
    try {
      await api.notifications.dismiss(id);
    } catch (err) {
      console.error('Failed to dismiss on server:', err);
      loadNotifications(true);
    }
  };

  const handleToggleDismiss = async (id: string, currentlyDismissed: boolean) => {
    const nextDismissed = !currentlyDismissed;
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, isDismissed: nextDismissed, dismissedAt: nextDismissed ? new Date().toISOString() : null } : n
      )
    );
    try {
      await api.notifications.update(id, {
        isDismissed: nextDismissed,
      });
    } catch (err) {
      console.error('Failed to update dismiss status:', err);
      loadNotifications(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;

    // Immediately remove from client state
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      await api.notifications.delete(id);
    } catch (err) {
      console.error('Failed to delete on server:', err);
      loadNotifications(true);
    }
  };

  const handleCreated = (newItem: NotificationItem) => {
    // Appears on dashboard immediately without page reload
    setNotifications(prev => [newItem, ...prev]);
  };

  const handleUpdated = (updatedItem: NotificationItem) => {
    setNotifications(prev => prev.map(n => (n.id === updatedItem.id ? updatedItem : n)));
  };

  // Filtered notifications list
  const filteredNotifications = notifications.filter(n => {
    if (categoryFilter !== 'ALL' && n.category !== categoryFilter) {
      return false;
    }
    if (statusFilter === 'ACTIVE' && n.isDismissed) {
      return false;
    }
    if (statusFilter === 'DISMISSED' && !n.isDismissed) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchHeader = n.header.toLowerCase().includes(q);
      const matchBody = n.body.toLowerCase().includes(q);
      if (!matchHeader && !matchBody) return false;
    }
    return true;
  });

  // Metrics summary
  const errorCount = notifications.filter(n => n.category === 'ERROR').length;
  const warningCount = notifications.filter(n => n.category === 'WARNING').length;
  const infoCount = notifications.filter(n => n.category === 'INFO').length;

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenDigest={() => setIsDigestOpen(true)}
        unreadCount={undismissedNotifications.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* REAL-TIME BANNERS SECTION */}
        <section id="real-time-banners-section" className="space-y-3">
          {showSummaryBanner ? (
            /* Summary banner shown when > 5 undismissed notifications */
            <div
              id="summary-banner"
              className="bg-amber-500 text-white rounded-xl p-4 shadow-sm border border-amber-600 flex items-center justify-between gap-4 animate-in fade-in"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-600/60 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">You have more notifications</h3>
                  <p className="text-xs text-amber-100">
                    There are {undismissedNotifications.length} active undismissed alerts requiring your attention in the dashboard below.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStatusFilter('ACTIVE');
                  const el = document.getElementById('notifications-list-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-lg bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition-colors shrink-0 shadow-2xs"
              >
                View All Active
              </button>
            </div>
          ) : (
            /* Up to 5 individual dismissible banners */
            topBanners.map(notification => (
              <NotificationBanner
                key={notification.id}
                notification={notification}
                onDismiss={handleDismiss}
                onRemediate={item => setRemediatingItem(item)}
              />
            ))
          )}
        </section>

        {/* Telemetry Metric Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Alerts</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{notifications.length}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Bell className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => setCategoryFilter(categoryFilter === 'ERROR' ? 'ALL' : 'ERROR')}
            className={`cursor-pointer p-4 rounded-xl border transition-all shadow-2xs flex items-center justify-between ${
              categoryFilter === 'ERROR'
                ? 'bg-red-50 border-red-300 ring-2 ring-red-400'
                : 'bg-white border-slate-200 hover:border-red-200'
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">Critical Errors</p>
              <p className="text-xl font-black text-red-600 mt-0.5">{errorCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => setCategoryFilter(categoryFilter === 'WARNING' ? 'ALL' : 'WARNING')}
            className={`cursor-pointer p-4 rounded-xl border transition-all shadow-2xs flex items-center justify-between ${
              categoryFilter === 'WARNING'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                : 'bg-white border-slate-200 hover:border-amber-200'
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Warnings</p>
              <p className="text-xl font-black text-amber-600 mt-0.5">{warningCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => setCategoryFilter(categoryFilter === 'INFO' ? 'ALL' : 'INFO')}
            className={`cursor-pointer p-4 rounded-xl border transition-all shadow-2xs flex items-center justify-between ${
              categoryFilter === 'INFO'
                ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400'
                : 'bg-white border-slate-200 hover:border-sky-200'
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">Info (Auto-90s)</p>
              <p className="text-xl font-black text-sky-600 mt-0.5">{infoCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search header or body content..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {(['ALL', 'ERROR', 'WARNING', 'INFO'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-200 mx-1 shrink-0" />

              {/* Status Filter */}
              {(['ALL', 'ACTIVE', 'DISMISSED'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'ALL' ? 'All Status' : status === 'ACTIVE' ? 'Active' : 'Dismissed'}
                </button>
              ))}

              {/* Refresh Button */}
              <button
                onClick={() => loadNotifications(true)}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 ml-1"
                title="Sync from server"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS DASHBOARD LIST */}
        <section id="notifications-list-section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Notification Feed ({filteredNotifications.length})
            </h2>
            <span className="text-xs text-slate-400">Sorted most-recent first</span>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs font-medium">Loading notifications from NestJS API...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">No notifications found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No notifications match your active filter parameters.'
                  : 'Your notification inbox is clean. Dispatch a new notification to test real-time banners and AI triage.'}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Notification</span>
              </button>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onEdit={item => setEditingItem(item)}
                onDelete={handleDelete}
                onToggleDismiss={handleToggleDismiss}
                onRemediate={item => setRemediatingItem(item)}
              />
            ))
          )}
        </section>
      </main>

      {/* Modals */}
      <CreateNotificationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />

      <EditNotificationModal
        notification={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onUpdated={handleUpdated}
      />

      <RemediationModal
        notification={remediatingItem}
        isOpen={!!remediatingItem}
        onClose={() => setRemediatingItem(null)}
      />

      <AiDigestModal
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
      />
    </div>
  );
};

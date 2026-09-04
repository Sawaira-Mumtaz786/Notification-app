import React, { useState, useEffect } from 'react';
import { NotificationCategory, NotificationItem } from '../types/index.ts';
import { api } from '../services/api.ts';
import { X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface EditNotificationModalProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: NotificationItem) => void;
}

export const EditNotificationModal: React.FC<EditNotificationModalProps> = ({
  notification,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('INFO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ header?: string; body?: string; general?: string }>({});

  useEffect(() => {
    if (notification) {
      setHeader(notification.header);
      setBody(notification.body);
      setCategory(notification.category);
      setErrors({});
    }
  }, [notification]);

  if (!isOpen || !notification) return null;

  const validate = (): boolean => {
    const errs: { header?: string; body?: string } = {};
    if (!header.trim()) {
      errs.header = 'Header is required';
    } else if (header.trim().length > 120) {
      errs.header = 'Header cannot exceed 120 characters';
    }

    if (!body.trim()) {
      errs.body = 'Body content is required';
    } else if (body.trim().length > 2000) {
      errs.body = 'Body content cannot exceed 2000 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const updated = await api.notifications.update(notification.id, {
        header: header.trim(),
        body: body.trim(),
        category,
      });
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to update notification' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Notification</h2>
            <p className="text-xs text-slate-500">Update alert parameters and severity category</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errors.general}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {(['INFO', 'WARNING', 'ERROR'] as NotificationCategory[]).map(cat => {
                const isSelected = category === cat;
                const colors = {
                  INFO: isSelected
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50',
                  WARNING: isSelected
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50',
                  ERROR: isSelected
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-red-50',
                };
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${colors[cat]}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="edit-header" className="block text-xs font-semibold text-slate-700">
                Header / Title <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{header.length}/120</span>
            </div>
            <input
              id="edit-header"
              type="text"
              value={header}
              onChange={e => setHeader(e.target.value)}
              maxLength={120}
              className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 ${
                errors.header
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
            />
            {errors.header && <p className="text-xs text-red-600 mt-1">{errors.header}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="edit-body" className="block text-xs font-semibold text-slate-700">
                Body Content <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{body.length}/2000</span>
            </div>
            <textarea
              id="edit-body"
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={2000}
              className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 resize-none ${
                errors.body
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
            />
            {errors.body && <p className="text-xs text-red-600 mt-1">{errors.body}</p>}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-update-notification"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

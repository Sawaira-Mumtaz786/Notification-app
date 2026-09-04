import React from 'react';
import { NotificationItem } from '../types/index.ts';
import { AlertOctagon, AlertTriangle, Info, Edit3, Trash2, EyeOff, Eye, Sparkles, Calendar } from 'lucide-react';

interface NotificationCardProps {
  notification: NotificationItem;
  onEdit: (notification: NotificationItem) => void;
  onDelete: (id: string) => void;
  onToggleDismiss: (id: string, currentlyDismissed: boolean) => void;
  onRemediate: (notification: NotificationItem) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onEdit,
  onDelete,
  onToggleDismiss,
  onRemediate,
}) => {
  const isError = notification.category === 'ERROR';
  const isWarning = notification.category === 'WARNING';
  const isInfo = notification.category === 'INFO';

  const categoryConfig = {
    ERROR: {
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      borderAccent: 'border-l-red-500',
      icon: <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />,
      dot: 'bg-red-500',
    },
    WARNING: {
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      borderAccent: 'border-l-amber-500',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
      dot: 'bg-amber-500',
    },
    INFO: {
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      borderAccent: 'border-l-sky-500',
      icon: <Info className="w-4 h-4 text-sky-600 shrink-0" />,
      dot: 'bg-sky-500',
    },
  };

  const config = categoryConfig[notification.category];

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <article
      id={`card-${notification.id}`}
      className={`group bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all duration-200 border-l-4 ${config.borderAccent} ${
        notification.isDismissed ? 'opacity-70 bg-slate-50/50' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Top metadata tags */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${config.badgeBg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {notification.category}
            </span>

            {notification.urgencyScore && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                Urgency {notification.urgencyScore}/10
              </span>
            )}

            {notification.isDismissed && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Dismissed from banner
              </span>
            )}

            <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
              <Calendar className="w-3 h-3" />
              {formatDate(notification.createdAt)}
            </span>
          </div>

          {/* Header */}
          <h2 className="text-base font-semibold text-slate-900 mb-2 leading-snug break-words">
            {notification.header}
          </h2>

          {/* Body */}
          <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
            {notification.body}
          </p>

          {/* AI Remediation preview if available */}
          {notification.aiRemediation && (
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Playbook / Root-Cause Notes</span>
              </div>
              <p className="line-clamp-2 text-slate-600 italic">{notification.aiRemediation}</p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex sm:flex-col items-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {(isError || isWarning) && (
            <button
              id={`btn-remediate-${notification.id}`}
              onClick={() => onRemediate(notification)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              title="Generate AI Incident Remediation Playbook"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">AI Playbook</span>
            </button>
          )}

          <button
            id={`btn-edit-${notification.id}`}
            onClick={() => onEdit(notification)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 text-xs"
            title="Edit Notification"
          >
            <Edit3 className="w-4 h-4" />
            <span className="sm:hidden text-xs">Edit</span>
          </button>

          <button
            id={`btn-dismiss-${notification.id}`}
            onClick={() => onToggleDismiss(notification.id, notification.isDismissed)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs"
            title={notification.isDismissed ? 'Restore to banner' : 'Dismiss from banner'}
          >
            {notification.isDismissed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="sm:hidden text-xs">
              {notification.isDismissed ? 'Show' : 'Dismiss'}
            </span>
          </button>

          <button
            id={`btn-delete-${notification.id}`}
            onClick={() => onDelete(notification.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 text-xs"
            title="Delete Notification"
          >
            <Trash2 className="w-4 h-4" />
            <span className="sm:hidden text-xs text-red-600">Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
};

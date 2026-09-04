import React, { useEffect, useState } from 'react';
import { NotificationItem, NotificationCategory } from '../types/index.ts';
import { AlertOctagon, AlertTriangle, Info, X, Clock, Sparkles } from 'lucide-react';

interface NotificationBannerProps {
  notification: NotificationItem;
  onDismiss: (id: string) => void;
  onRemediate?: (notification: NotificationItem) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
  onRemediate,
}) => {
  const isInfo = notification.category === 'INFO';
  const isError = notification.category === 'ERROR';
  const isWarning = notification.category === 'WARNING';

  // 90-second countdown for INFO category
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!isInfo) return 90;
    const elapsed = Math.floor((Date.now() - new Date(notification.createdAt).getTime()) / 1000);
    return Math.max(0, 90 - elapsed);
  });

  useEffect(() => {
    if (!isInfo) return;

    if (remainingSeconds <= 0) {
      onDismiss(notification.id);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss(notification.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isInfo, notification.id, onDismiss, remainingSeconds]);

  // Color mappings conforming to prompt requirement:
  // ERROR red, WARNING yellow/amber, INFO blue
  const categoryStyles = {
    ERROR: {
      container: 'bg-red-50/90 border-red-200 text-red-900',
      badge: 'bg-red-100 text-red-800 border-red-200',
      icon: <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
      accentBar: 'bg-red-600',
    },
    WARNING: {
      container: 'bg-amber-50/90 border-amber-200 text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      accentBar: 'bg-amber-500',
    },
    INFO: {
      container: 'bg-sky-50/90 border-sky-200 text-sky-900',
      badge: 'bg-sky-100 text-sky-800 border-sky-200',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
      accentBar: 'bg-sky-500',
    },
  };

  const currentStyle = categoryStyles[notification.category];
  const progressPercent = isInfo ? Math.max(0, Math.min(100, (remainingSeconds / 90) * 100)) : 100;

  return (
    <div
      id={`banner-${notification.id}`}
      className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-300 ${currentStyle.container}`}
    >
      {/* Auto-close progress bar for INFO */}
      {isInfo && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-sky-200/50">
          <div
            className="h-full bg-sky-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {currentStyle.icon}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${currentStyle.badge}`}>
                {notification.category}
              </span>
              {notification.urgencyScore && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                  Urgency {notification.urgencyScore}/10
                </span>
              )}
              {isInfo && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 animate-pulse" />
                  <span>Auto-close in {remainingSeconds}s</span>
                </span>
              )}
            </div>

            <h3 className="font-semibold text-sm leading-tight mb-1 text-slate-900 break-words">
              {notification.header}
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
              {notification.body}
            </p>

            {/* AI Remediation Quick Link for Warning/Error */}
            {(isError || isWarning) && onRemediate && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => onRemediate(notification)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 hover:text-indigo-600 bg-white/80 hover:bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>AI Incident Playbook & Root Cause</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dismiss banner button */}
        <button
          onClick={() => onDismiss(notification.id)}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-black/5 transition-colors shrink-0"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

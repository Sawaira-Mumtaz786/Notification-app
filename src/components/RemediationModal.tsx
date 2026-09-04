import React, { useState, useEffect } from 'react';
import { NotificationItem, RemediationResult } from '../types/index.ts';
import { api } from '../services/api.ts';
import { X, Sparkles, AlertOctagon, CheckCircle, ShieldCheck, Terminal, Loader2 } from 'lucide-react';

interface RemediationModalProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RemediationModal: React.FC<RemediationModalProps> = ({
  notification,
  isOpen,
  onClose,
}) => {
  const [remediation, setRemediation] = useState<RemediationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRemediation() {
      if (!notification) return;
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.ai.getRemediation(
          notification.header,
          notification.body,
          notification.category
        );
        setRemediation(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch AI incident playbook');
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen && notification) {
      fetchRemediation();
    } else {
      setRemediation(null);
    }
  }, [isOpen, notification]);

  if (!isOpen || !notification) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Incident Playbook & Remediation</h2>
              <p className="text-xs text-slate-500">Automated diagnostic and mitigation protocol powered by Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Target Notification snippet */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                notification.category === 'ERROR'
                  ? 'bg-red-100 text-red-800'
                  : notification.category === 'WARNING'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-sky-100 text-sky-800'
              }`}>
                {notification.category}
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate">{notification.header}</span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-2">{notification.body}</p>
          </div>

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
              <p className="text-xs font-medium">Analyzing incident root causes and generating recovery playbook...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <p className="font-semibold">Unable to generate playbook:</p>
              <p>{error}</p>
            </div>
          )}

          {remediation && !isLoading && (
            <div className="space-y-4">
              {/* Executive Diagnostic Summary */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Diagnostic Assessment
                </h3>
                <p className="text-xs text-indigo-900 leading-relaxed">{remediation.summary}</p>
              </div>

              {/* Probable Root Causes */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                  Probable Root Causes
                </h3>
                <ul className="space-y-1.5">
                  {remediation.probableRootCauses.map((cause, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Steps */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Immediate Triage Action Steps
                </h3>
                <ul className="space-y-1.5">
                  {remediation.actionSteps.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recovery Playbook & Mitigations */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-700" />
                  Mitigation Playbook
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap shadow-inner border border-slate-800">
                  {remediation.recoveryPlaybook}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Close Playbook
          </button>
        </div>
      </div>
    </div>
  );
};

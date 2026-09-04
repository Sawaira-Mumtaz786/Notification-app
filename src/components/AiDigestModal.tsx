import React, { useState, useEffect } from 'react';
import { SystemDigestResult } from '../types/index.ts';
import { api } from '../services/api.ts';
import { X, Sparkles, Activity, ShieldAlert, AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react';

interface AiDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiDigestModal: React.FC<AiDigestModalProps> = ({ isOpen, onClose }) => {
  const [digest, setDigest] = useState<SystemDigestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDigest() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.ai.getDigest();
        setDigest(data);
      } catch (err: any) {
        setError(err.message || 'Failed to compute AI system digest');
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen) {
      loadDigest();
    } else {
      setDigest(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Incident Digest & Health Synthesis</h2>
              <p className="text-xs text-slate-500">Autonomous synthesis across all active alerts and incident events</p>
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
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
              <p className="text-xs font-medium">Aggregating telemetry and generating executive digest...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <p className="font-semibold">Failed to generate digest:</p>
              <p>{error}</p>
            </div>
          )}

          {digest && !isLoading && (
            <div className="space-y-4">
              {/* Overall status badge & summary */}
              <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-slate-200">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 block mb-1">
                    System Health Index
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        digest.status === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : digest.status === 'DEGRADED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      {digest.status}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      {digest.status === 'CRITICAL'
                        ? 'Immediate intervention required'
                        : digest.status === 'DEGRADED'
                        ? 'Performance bottlenecks detected'
                        : 'All parameters healthy'}
                    </span>
                  </div>
                </div>

                {/* Counts pill breakdown */}
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{digest.criticalAlertsCount} Critical</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{digest.warningCount} Warn</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>{digest.infoCount} Info</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1.5">
                  Executive Briefing
                </h3>
                <p className="text-xs text-indigo-900 leading-relaxed">{digest.executiveSummary}</p>
              </div>

              {/* Key Insights */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Key Incident Observations
                </h3>
                <ul className="space-y-1.5">
                  {digest.keyInsights.map((insight, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Actions */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Recommended Next Actions
                </h3>
                <ul className="space-y-1.5">
                  {digest.recommendedActions.map((action, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ul>
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

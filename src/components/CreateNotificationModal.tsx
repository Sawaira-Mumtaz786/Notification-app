import React, { useState } from 'react';
import { NotificationCategory, NotificationItem, TriageResult } from '../types/index.ts';
import { api } from '../services/api.ts';
import { X, Sparkles, AlertCircle, CheckCircle2, Wand2, Loader2 } from 'lucide-react';

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: NotificationItem) => void;
}

export const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('INFO');
  const [urgencyScore, setUrgencyScore] = useState<number | null>(null);
  const [aiRemediation, setAiRemediation] = useState<string | null>(null);

  // AI states
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageFeedback, setTriageFeedback] = useState<string | null>(null);
  const [promptDraft, setPromptDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ header?: string; body?: string; general?: string }>({});

  if (!isOpen) return null;

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
      const created = await api.notifications.create({
        header: header.trim(),
        body: body.trim(),
        category,
        urgencyScore,
        aiRemediation,
      });
      onCreated(created);
      onClose();
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to create notification' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiTriage = async () => {
    if (!header.trim() && !body.trim()) {
      setErrors({ header: 'Please enter a header or body first to run AI triage' });
      return;
    }

    setIsTriaging(true);
    setTriageFeedback(null);
    setErrors({});

    try {
      const result: TriageResult = await api.ai.triage(header, body);
      setCategory(result.category);
      setUrgencyScore(result.urgencyScore);
      if (result.refinedHeader && result.refinedHeader !== header) {
        setHeader(result.refinedHeader);
      }
      if (result.refinedBody && result.refinedBody !== body) {
        setBody(result.refinedBody);
      }
      setTriageFeedback(
        `AI Triage assigned [${result.category}] (Urgency: ${result.urgencyScore}/10). ${result.reasoning}`
      );
    } catch (err: any) {
      setErrors({ general: err.message || 'AI Triage service temporarily unavailable' });
    } finally {
      setIsTriaging(false);
    }
  };

  const handleDraftFromPrompt = async (presetPrompt?: string) => {
    const textToUse = presetPrompt || promptDraft;
    if (!textToUse.trim()) return;

    setIsDrafting(true);
    setErrors({});
    try {
      const draft = await api.ai.draft(textToUse);
      setHeader(draft.header);
      setBody(draft.body);
      setCategory(draft.category);
      setUrgencyScore(draft.urgencyScore);
      setShowPromptInput(false);
      setPromptDraft('');
      setTriageFeedback(`Draft generated for: "${textToUse}"`);
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to draft notification' });
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Create Notification</h2>
            <p className="text-xs text-slate-500">Dispatch a new alert to your dashboard and real-time banner</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Quick Generator Prompt Toggle */}
        <div className="px-6 pt-4">
          <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI Incident Assistant
              </span>
              <button
                type="button"
                onClick={() => setShowPromptInput(!showPromptInput)}
                className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 underline underline-offset-2"
              >
                {showPromptInput ? 'Hide Draft Helper' : 'Draft from Incident Prompt'}
              </button>
            </div>

            {showPromptInput && (
              <div className="mt-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promptDraft}
                    onChange={e => setPromptDraft(e.target.value)}
                    placeholder="e.g. Gateway 504 timeout during flash sale..."
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={e => e.key === 'Enter' && handleDraftFromPrompt()}
                  />
                  <button
                    type="button"
                    disabled={isDrafting || !promptDraft.trim()}
                    onClick={() => handleDraftFromPrompt()}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 shrink-0"
                  >
                    {isDrafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    <span>Generate</span>
                  </button>
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-indigo-600 font-medium self-center">Quick Scenarios:</span>
                  {[
                    'Database query timeout on /checkout',
                    'High CPU usage on worker-03 (89%)',
                    'Scheduled Kubernetes cluster upgrade Sunday 02:00 UTC',
                  ].map(scenario => (
                    <button
                      key={scenario}
                      type="button"
                      onClick={() => handleDraftFromPrompt(scenario)}
                      className="text-[10px] px-2 py-0.5 rounded bg-white text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    >
                      {scenario.split(' ')[0]} {scenario.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errors.general}</span>
            </div>
          )}

          {triageFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed">{triageFeedback}</span>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['INFO', 'WARNING', 'ERROR'] as NotificationCategory[]).map(cat => {
                const isSelected = category === cat;
                const colors = {
                  INFO: isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50',
                  WARNING: isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50',
                  ERROR: isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
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

          {/* Header Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="input-header" className="block text-xs font-semibold text-slate-700">
                Header / Title <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{header.length}/120</span>
            </div>
            <input
              id="input-header"
              type="text"
              value={header}
              onChange={e => setHeader(e.target.value)}
              placeholder="e.g. Critical Redis memory breach"
              maxLength={120}
              className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 ${
                errors.header
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
            />
            {errors.header && <p className="text-xs text-red-600 mt-1">{errors.header}</p>}
          </div>

          {/* Body Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="input-body" className="block text-xs font-semibold text-slate-700">
                Body Content <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{body.length}/2000</span>
            </div>
            <textarea
              id="input-body"
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Provide context, diagnostic logs, affected services, or recommended mitigations..."
              maxLength={2000}
              className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 resize-none ${
                errors.body
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
            />
            {errors.body && <p className="text-xs text-red-600 mt-1">{errors.body}</p>}
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={isTriaging || (!header.trim() && !body.trim())}
              onClick={handleAiTriage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors disabled:opacity-50"
              title="Automatically classify category & urgency using Gemini"
            >
              {isTriaging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
              <span>AI Auto-Triage</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-notification"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Notification</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

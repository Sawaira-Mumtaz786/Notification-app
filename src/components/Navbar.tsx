import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Bell, Plus, Sparkles, LogOut, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  onOpenCreate: () => void;
  onOpenDigest: () => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreate, onOpenDigest, unreadCount }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-900/10">
            <Bell className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base tracking-tight">NotificationOps</h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                NestJS + React
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Full-Stack Real-time Event System</p>
          </div>
        </div>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-ai-digest"
            onClick={onOpenDigest}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
            title="Generate AI Executive Incident Digest"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Digest</span>
          </button>

          <button
            id="btn-create-notification"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Notification</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900">{user.fullName}</span>
                <span className="text-[11px] text-slate-500">@{user.username}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <button
                id="btn-logout"
                onClick={logout}
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Sign out of your session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { User, Notification, ActivityLog } from '../types';
import { store } from '../db/store';
import { 
  Trophy, LogOut, Bell, CheckCircle, Shield, User as UserIcon, 
  Moon, Sun, Clock, BookOpen, AlertCircle 
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  onLogout: () => void;
  notifications: Notification[];
  logs: ActivityLog[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onLogout,
  notifications,
  logs,
  darkMode,
  onToggleDarkMode
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    store.clearNotifications();
  };

  const currentInitials = currentUser.name.split(' ').map(n=>n[0]).join('');

  return (
    <aside id="main-navigation-sidebar" className={`w-full lg:w-64 border-b lg:border-b-0 lg:border-r flex flex-col justify-between shrink-0 p-6 transition-colors duration-300 ${
      darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200'
    }`}>
      
      <div className="space-y-6">
        {/* Core title typography */}
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#16A34A] rounded-lg flex items-center justify-center shrink-0">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className={`font-bold text-lg tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              LEARNING GEMS
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">
            Performance Hub v2.0
          </p>
        </div>

        {/* Logged user presentation */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-10 w-10 bg-emerald-500/5 rounded-full translate-x-2 -translate-y-2 group-hover:scale-125 transition" />
          
          <div className="w-10 h-10 bg-emerald-50 text-emerald-800 font-black rounded-lg flex items-center justify-center shadow-inner font-display text-xs">
            {currentInitials}
          </div>

          <div className="z-10 truncate">
            <h4 className="text-xs font-bold text-slate-850 truncate">{currentUser.name}</h4>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full mt-1">
              {currentUser.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : null}
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Dynamic Interactive Notifications and Logs System */}
        <div className="space-y-3 pt-4 border-t border-slate-150">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            <span>Security Alerts</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[8px] font-black animate-pulse">
                {unreadCount} NEW
              </span>
            )}
          </div>

          <div className="space-y-2">
            {/* Real notification button toggle */}
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowLogs(false);
              }}
              className={`w-full flex items-center justify-between text-xs font-medium p-2.5 rounded-lg transition-all text-slate-600 hover:bg-slate-50 border ${
                showNotifications ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" /> Notifications Feed
              </span>
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                {notifications.length}
              </span>
            </button>

            {/* Notification Drawer panel block */}
            {showNotifications && (
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-405 border-b border-slate-200 pb-1.5 uppercase tracking-wide">
                  <span>Current Board Messages</span>
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-emerald-700 hover:underline cursor-pointer font-bold"
                  >
                    Clear All
                  </button>
                </div>
                
                {notifications.map(n => (
                  <div key={n.id} className="text-[10px] leading-tight space-y-1 bg-white p-2 rounded border border-slate-200/50">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                      {n.title}
                    </p>
                    <p className="text-slate-500">{n.message}</p>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic text-center py-2 select-none">
                    Security checklist cleared.
                  </p>
                )}
              </div>
            )}

            {/* Audit Logs button */}
            <button
              onClick={() => {
                setShowLogs(!showLogs);
                setShowNotifications(false);
              }}
              className={`w-full flex items-center justify-between text-xs font-medium p-2.5 rounded-lg transition-all text-slate-600 hover:bg-slate-50 border ${
                showLogs ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" /> Live Activity Log
              </span>
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                {logs.length}
              </span>
            </button>

            {/* Audit Logs expander */}
            {showLogs && (
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto font-mono text-[9px]">
                <p className="font-bold text-slate-400 pb-1 mb-1 border-b border-slate-200 uppercase tracking-wide">
                  Operational Audits
                </p>
                {logs.map(log => (
                  <div key={log.id} className="text-slate-600 leading-normal border-b border-slate-200/40 pb-1 last:border-b-0">
                    <span className="text-emerald-600 font-bold">[{log.author}]</span> {log.action}
                    <span className="block text-[8px] text-slate-400 text-right">{log.timestamp.split('T')[1]?.slice(0, 5) || '14:00'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Brand Theme AI Insight Widget */}
        <div className={`pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className={`${darkMode ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-[#F1FDF4] border-[#DCFCE7]'} p-4 rounded-xl border`}>
            <p className={`text-[11px] font-bold uppercase mb-1 ${darkMode ? 'text-emerald-400' : 'text-[#15803D]'}`}>
              AI Insight
            </p>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Team productivity is up 12% this month. Vishnudas S K is on track for Best Performer.
            </p>
          </div>
        </div>

      </div>

      {/* Footer controls: logout, dark mode, copyrights */}
      <div className="space-y-4 pt-6 border-t border-slate-150">
        
        {/* Dynamic Dark Mode Simulator toggle */}
        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span className="font-semibold flex items-center gap-2">
            {darkMode ? <Sun className="w-4 h-4 text-yellow-500 animate-spin" style={{ animationDuration: '10s' }} /> : <Moon className="w-4 h-4 text-emerald-600" />}
            {darkMode ? 'Solar Flare Mode' : 'Cosmic Slate Mode'}
          </span>
          <button
            onClick={onToggleDarkMode}
            type="button"
            className="w-8 h-4.5 bg-slate-200 text-slate-705 border border-slate-300 rounded-full relative flex items-center p-0.5 transition cursor-pointer"
          >
            <div className={`w-3.5 h-3.5 bg-emerald-600 rounded-full transition-all transform ${
              darkMode ? 'translate-x-3.5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* True logout exit trigger */}
        <button
          onClick={onLogout}
          type="button"
          id="btn-logout"
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-display"
        >
          <LogOut className="w-3.5 h-3.5" /> Close Gateway Session
        </button>

        <p className="text-[8px] text-slate-400 text-center font-semibold tracking-wider font-mono">
          © 2026 LEARNING GEMS TECH.
        </p>
      </div>

    </aside>
  );
};

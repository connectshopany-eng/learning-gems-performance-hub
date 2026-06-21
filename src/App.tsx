import React, { useState, useEffect } from 'react';
import { store } from './db/store';
import { User } from './types';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { Shield, Sparkles, HelpCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbState, setDbState] = useState(store.getState());
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Synchronize dynamic store updates to force rerender
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setDbState(store.getState());
    });

    // Recover login session if present
    const savedSession = localStorage.getItem('learning_gems_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        // Verify user still exists in directory
        const verified = store.getUsers().find(u => u.id === parsed.id && u.status === 'active');
        if (verified) {
          setCurrentUser(verified);
        }
      } catch (e) {
        console.error("Session restore failed", e);
      }
    }

    setLoading(false);
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('learning_gems_session', JSON.stringify(user));
    if (user.role === 'employee') {
      store.punchIn(user.id, user.name);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      store.log(currentUser.id, currentUser.name, "Closed session connection");
      if (currentUser.role === 'employee') {
        store.punchOut(currentUser.id, currentUser.name);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('learning_gems_session');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-display">Initializing Performance Engine...</p>
        </div>
      </div>
    );
  }

  // Not logged in: Route to high-fidelity login scren
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-all duration-300 ${
      darkMode ? 'bg-slate-950 dark text-slate-100' : 'bg-[#F9FAFB]'
    }`}>
      
      {/* Absolute Header Ribbon */}
      <div className="absolute top-0 inset-x-0 h-1 bg-[#16A34A] z-50 pointer-events-none" />

      {/* Main Layout Sidebar (Dynamic Alerts & Audit feeds) */}
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        notifications={dbState.notifications}
        logs={dbState.logs}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Primary Work area container */}
      <main id="main-workbench" className="flex-1 p-6 md:p-8 lg:p-10 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Dynamic Context Header */}
        <div className={`border p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="space-y-1">
            <span className="text-[9px] font-black tracking-widest text-[#16A34A] uppercase font-display block select-none">
              Authorized Session
            </span>
            <h2 className={`text-xl font-bold tracking-tight font-display ${
              darkMode ? 'text-white' : 'text-slate-800'
            }`}>
              {currentUser.role === 'admin' 
                ? 'Learning Gems Corporate HQ Gateway' 
                : `Assigned Workspace | ${currentUser.name}`
              }
            </h2>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} max-w-xl`}>
              {currentUser.role === 'admin'
                ? 'Direct oversight of digital storyboarding assignments, automated score formula calculations, and predictive talent pipelines.'
                : 'Develop core story course assets, track daily attendance status, and evaluate quarterly performance marks.'
              }
            </p>
          </div>

          <div className={`flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl border ${
            darkMode ? 'bg-slate-850 border-slate-800 text-slate-300' : 'bg-slate-50/80 border-slate-200 text-slate-705'
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Live Connection OK
            </span>
          </div>
        </div>

        {/* View Routing Gates */}
        {currentUser.role === 'admin' ? (
          <AdminDashboard
            currentUser={currentUser}
            users={dbState.users}
            projects={dbState.projects}
            slides={dbState.slides}
            attendance={dbState.attendance}
            punches={dbState.punches}
          />
        ) : (
          <EmployeeDashboard
            currentUser={currentUser}
            users={dbState.users}
            projects={dbState.projects}
            slides={dbState.slides}
            attendance={dbState.attendance}
            punches={dbState.punches}
          />
        )}

      </main>
    </div>
  );
}

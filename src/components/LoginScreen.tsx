import React, { useState } from 'react';
import { User } from '../types';
import { KeyRound, Mail, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { store } from '../db/store';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'admin' | 'employee'>('admin');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please specify both registered email and password.');
      return;
    }

    const users = store.getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!foundUser) {
      setErrorMsg('No user registered with this email address.');
      return;
    }

    if (foundUser.status === 'deactivated') {
      setErrorMsg('This account is currently deactivated. Contact HR Admin.');
      return;
    }

    // Direct password match (seeds are name-lowercase / custom passwords)
    if (foundUser.password === password.trim()) {
      // Success logs
      store.log(foundUser.id, foundUser.name, `Logged into the hub successfully as [${foundUser.role}]`);
      onLoginSuccess(foundUser);
    } else {
      setErrorMsg('Incorrect Password. Please check and retry.');
    }
  };

  const handleQuickConnect = (user: User) => {
    store.log(user.id, user.name, `Logged in via Quick Connection as [${user.role}]`);
    onLoginSuccess(user);
  };

  const allUsers = store.getUsers();
  const adminUsers = allUsers.filter(u => u.role === 'admin');
  const employeeUsers = allUsers.filter(u => u.role === 'employee' && u.status === 'active');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] relative px-4 py-12">
      {/* Absolute Header Overlay */}
      <div className="absolute top-0 inset-x-0 h-1 bg-[#16A34A]" />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left column: Brand Narrative */}
        <div className="md:col-span-5 text-center md:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#DCFCE7] text-[#16A34A] text-xs font-semibold rounded-full border border-green-200 font-display">
            <Sparkles className="w-3.5 h-3.5" />
            Learning Gems Technologies
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">
              PERFORMANCE <br/>
              <span className="text-[#16A34A]">HUB ENGINE</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-md">
              Replacing fragmented Excel logs with absolute real-time slide status updates, active attendance logs, and predictive Gemini talent forecasting.
            </p>
          </div>

          {/* Quick Metrics display */}
          <div className="hidden md:grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div>
              <div className="text-lg font-bold text-slate-800 font-display">5 Active</div>
              <div className="text-xs text-slate-500">Design Engineers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800 font-display">Formula</div>
              <div className="text-xs text-slate-500">Auto KPI Tracking</div>
            </div>
          </div>
        </div>

        {/* Right column: Login Interface */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 font-display">Account Authorization</h2>
              <p className="text-xs text-slate-500">Enter credentials or select a quick-connect profile below</p>
            </div>

            {/* TAB SELECTORS */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md font-display transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#16A34A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Admin Gateway
              </button>
              <button
                onClick={() => setActiveTab('employee')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md font-display transition-all cursor-pointer ${
                  activeTab === 'employee'
                    ? 'bg-[#16A34A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Employee Workstation
              </button>
            </div>

            {/* ERROR DISPLAY */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* MANUAL FORM */}
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === 'admin' ? 'hebinraj.learninggems@gmail.com' : 'lekshmidas.learninggems@gmail.com'}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#16A34A] rounded-lg outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Credential Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#16A34A] rounded-lg outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="sumbit-manual-login"
                className="w-full py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold rounded-lg shadow-sm font-display cursor-pointer transition-colors"
              >
                Sign In to Dashboard
              </button>
            </form>

            {/* QUICK CONNECTS DESIGN */}
            <div className="space-y-3 pt-4 border-t border-slate-150">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                Reviewer Quick Connections
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeTab === 'admin' ? (
                  adminUsers.map(admin => (
                    <button
                      key={admin.id}
                      onClick={() => handleQuickConnect(admin)}
                      type="button"
                      className="flex items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#16A34A] rounded-lg text-left text-xs text-slate-705 transition cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <div className="truncate">
                        <p className="font-bold truncate text-slate-800">Admin Portal</p>
                        <p className="text-[9px] text-slate-400 font-mono">Role: admin</p>
                      </div>
                    </button>
                  ))
                ) : (
                  employeeUsers.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => handleQuickConnect(emp)}
                      type="button"
                      className="flex items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#16A34A] rounded-lg text-left text-xs text-slate-705 transition cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <div className="truncate">
                        <p className="font-bold truncate text-slate-800">{emp.name.split(' ')[0]}</p>
                        <p className="text-[9px] text-slate-400 font-mono truncate">{emp.id}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

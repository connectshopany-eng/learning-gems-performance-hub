import React, { useState, useEffect } from 'react';
import { User, Project, Slide, Attendance, PerformanceRecord, SlideStatus, PunchRecord } from '../types';
import { store } from '../db/store';
import { GeminiAISummarizer } from './GeminiAISummarizer';
import { 
  Briefcase, CheckCircle2, Link2, FileText, ClipboardList, TrendingUp, Calendar, 
  UserCheck, AlertCircle, Sparkles, LogOut, Award, RefreshCw, Trophy, Globe, Percent,
  Clock, Fingerprint, Timer, Search, Plus, Layers, AlertTriangle
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentUser: User;
  users: User[];
  projects: Project[];
  slides: Slide[];
  attendance: Attendance[];
  punches?: PunchRecord[];
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  users,
  projects,
  slides,
  attendance,
  punches = []
}) => {
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'leaderboard' | 'attendance' | 'combine'>('my-tasks');

  // Input editing states
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideStatus, setSlideStatus] = useState<SlideStatus>('Not Started');
  const [wordsCount, setWordsCount] = useState<number>(100);
  const [outputLink, setOutputLink] = useState<string>('');
  const [completionPct, setCompletionPct] = useState<number>(0);

  // Selected Month search
  const [selectedMonth, setSelectedMonth] = useState('2026-06');

  // Workstation segmented view toggle
  const [workstationView, setWorkstationView] = useState<'mine' | 'all-pool'>('mine');

  // Combine slide selection state
  const [selectedCombineProj, setSelectedCombineProj] = useState<string | null>(null);
  const [combineAlertModal, setCombineAlertModal] = useState<{isOpen: boolean, slideName: string} | null>(null);

  // Employee adding slide form states
  const [showAddSlideForm, setShowAddSlideForm] = useState(false);
  const [newSlideProject, setNewSlideProject] = useState('');
  const [newSlideName, setNewSlideName] = useState('');
  const [newSlideWords, setNewSlideWords] = useState(100);
  const [newSlideAssignToMe, setNewSlideAssignToMe] = useState(true);

  // Search/Filters in pool
  const [poolSearchQuery, setPoolSearchQuery] = useState('');
  const [poolProjectFilter, setPoolProjectFilter] = useState('all');

  // Live system clock for punch card
  const [systemTime, setSystemTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter punches for my current session/history
  const myPunches = punches.filter(p => p.userId === currentUser.id);
  const myActivePunch = myPunches.find(p => p.status === 'active');

  // -------------------------------------------------------------
  // CALCULATE PERSONAL METRICS
  // -------------------------------------------------------------
  const mySlides = slides.filter(s => s.assignedEmployeeId === currentUser.id);
  const myCompletedSlides = mySlides.filter(s => s.status === 'Completed');
  const totalMyWords = myCompletedSlides.reduce((acc, curr) => acc + curr.wordsCount, 0);

  // Leave and Attendance Calculations
  const myAttendance = attendance.filter(a => a.userId === currentUser.id && a.date.startsWith(selectedMonth));
  const myTotalWorkingDays = myAttendance.length;

  let myAttendancePercentage = 100;
  if (myTotalWorkingDays > 0) {
    const present = myAttendance.filter(a => a.code === 'P').length;
    const holiday = myAttendance.filter(a => a.code === 'H').length;
    const halfDay = myAttendance.filter(a => a.code === 'HD').length;
    myAttendancePercentage = Math.round(((present + holiday + (halfDay * 0.5)) / myTotalWorkingDays) * 100);
  }

  // Leave balance (24 annual baseline)
  const myUsedLeaves = attendance.filter(a => a.userId === currentUser.id && (a.code === 'CL' || a.code === 'SL')).length;
  const myLeaveBalance = Math.max(24 - myUsedLeaves, 0);

  // Find Leaderboard stats
  const leaderboard = store.calculateLeaderboard(selectedMonth);
  const myLeaderboardStat = leaderboard.find(l => l.userId === currentUser.id) || {
    slidesCompleted: myCompletedSlides.length,
    wordsProduced: totalMyWords,
    avgQualityScore: 92,
    attendancePercentage: myAttendancePercentage,
    projectsDelivered: 0,
    performanceScore: 0,
    rank: 5
  };

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleStartUpdate = (slide: Slide) => {
    setEditingSlideId(slide.id);
    setSlideStatus(slide.status);
    setWordsCount(slide.wordsCount);
    setOutputLink(slide.outputLink || '');
    
    // Derived completion percent
    setCompletionPct(
      slide.status === 'Good to Go' ? 100 :
      slide.status === 'Completed' ? 100 :
      slide.status === 'Client Review' ? 90 :
      slide.status === 'Internal Review' ? 75 :
      slide.status === 'In Progress' ? 40 : 0
    );
  };

  const handleSaveSlideProgress = (slideId: string) => {
    // Map slider completion % back to a standard status if they moved it
    let resolvedStatus = slideStatus;
    if (completionPct === 100) resolvedStatus = 'Completed';
    else if (completionPct >= 80 && resolvedStatus === 'In Progress') resolvedStatus = 'Client Review';
    else if (completionPct >= 50 && resolvedStatus === 'Not Started') resolvedStatus = 'In Progress';

    store.updateSlide(
      slideId, 
      { 
        status: resolvedStatus, 
        wordsCount: Number(wordsCount),
        outputLink
      }, 
      currentUser.id, 
      currentUser.name
    );

    // Auto notification alert for admin
    if (resolvedStatus === 'Internal Review' || resolvedStatus === 'Completed') {
      store.addNotification({
        type: 'attendance_alert',
        title: 'Review Needed',
        message: `${currentUser.name} submitted slide "${slides.find(s=>s.id === slideId)?.slideName}" for ${resolvedStatus}.`,
        read: false
      });
    }

    setEditingSlideId(null);
  };

  // Employee Slide operations
  const handleEmployeeAddSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideName || !newSlideProject) return;

    store.addSlide({
      projectId: newSlideProject,
      slideName: newSlideName,
      assignedEmployeeId: newSlideAssignToMe ? currentUser.id : '',
      wordsCount: Number(newSlideWords),
      status: newSlideAssignToMe ? 'In Progress' : 'Not Started',
      qualityScore: 0,
      outputLink: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      duration: 0,
      createdByUserId: currentUser.id,
      createdByUserName: currentUser.name
    });

    // Reset fields
    setNewSlideName('');
    setNewSlideWords(100);
    setNewSlideAssignToMe(true);
    setShowAddSlideForm(false);
  };

  const handleClaimSlide = (slideId: string) => {
    store.updateSlide(
      slideId,
      {
        assignedEmployeeId: currentUser.id,
        status: 'In Progress',
        startDate: new Date().toISOString().split('T')[0]
      },
      currentUser.id,
      currentUser.name
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Sub Tab Selector for Employees */}
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl shadow-sm gap-2">
        <button
          onClick={() => setActiveTab('my-tasks')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg font-display transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'my-tasks'
              ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/40 dark:text-emerald-400 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          {activeTab === 'my-tasks' && <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />}
          <ClipboardList className="w-4 h-4 shrink-0" /> My Slide Workstation
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg font-display transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'leaderboard'
              ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/40 dark:text-emerald-400 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          {activeTab === 'leaderboard' && <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />}
          <Trophy className="w-4 h-4 shrink-0" /> Company Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg font-display transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/40 dark:text-emerald-400 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          {activeTab === 'attendance' && <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />}
          <Calendar className="w-4 h-4 shrink-0" /> Attendance Sheet
        </button>
        <button
          onClick={() => {
            setActiveTab('combine');
            setSelectedCombineProj(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg font-display transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'combine'
              ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/40 dark:text-emerald-400 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          {activeTab === 'combine' && <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />}
          <Layers className="w-4 h-4 shrink-0" /> Combine Workspace
        </button>
      </div>

      {/* -------------------------------------------------------------
          SUB-TAB 1: WORKSTATION / TASKS
          ------------------------------------------------------------- */}
      {activeTab === 'my-tasks' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 font-display">My Creative Slide Assignments</h1>
              <p className="text-xs text-slate-500">Update draft stages, word logs, and submit Google project links</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Selected Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-700 w-36"
              />
            </div>
          </div>

          {/* Punch In / Punch Out Timing Terminal */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 relative overflow-hidden transition-all">
            {/* Background decoration */}
            <div className="absolute right-0 top-0 h-32 w-32 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 select-none pointer-events-none" />
            
            <div className="flex items-center gap-4 z-10 w-full md:w-auto">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-400 border border-slate-700 shrink-0">
                <Fingerprint className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shift Timing Station</span>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                    myActivePunch 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/20'
                  }`}>
                    {myActivePunch ? 'Shift Active' : 'Off Duty'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-display">Workstation Punch-In & Punch-Out Panel</h3>
                {myActivePunch ? (
                  <p className="text-xs text-slate-300">
                    Active since <span className="font-bold text-emerald-400 font-mono">{new Date(myActivePunch.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">Please punch in/out to track your logged times.</p>
                )}
              </div>
            </div>

            {/* Live Clock Display */}
            <div className="flex flex-col items-center justify-center bg-slate-850 px-5 py-3 rounded-xl border border-slate-800 font-mono shrink-0 text-center z-10">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Live Server Time</span>
              <span className="text-xl font-bold text-emerald-400 tracking-wider">
                {systemTime.toLocaleTimeString()}
              </span>
              <span className="text-[9px] text-slate-400">{systemTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-3 shrink-0 z-10">
              {!myActivePunch ? (
                <button
                  type="button"
                  onClick={() => store.punchIn(currentUser.id, currentUser.name)}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition cursor-pointer font-display"
                >
                  <Timer className="w-4 h-4 text-emerald-200 animate-pulse" />
                  Punch In Shift
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => store.punchOut(currentUser.id, currentUser.name)}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/20 hover:scale-[1.02] transition cursor-pointer font-display"
                >
                  <LogOut className="w-4 h-4 text-rose-200" />
                  Punch Out Shift
                </button>
              )}
            </div>
          </div>

          {/* Persona Metric Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Slides Completed</span>
                <span className="text-xl font-bold text-slate-800">{myCompletedSlides.length}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Words Produced</span>
                <span className="text-xl font-bold text-slate-800">{totalMyWords}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Performance Rank</span>
                <span className="text-xl font-bold text-slate-800"># {myLeaderboardStat.rank} <span className="text-xs font-semibold text-slate-400">/ 5</span></span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100/50 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Realtime Score</span>
                <span className="text-xl font-black text-emerald-600 font-mono">{myLeaderboardStat.performanceScore} pts</span>
              </div>
            </div>
          </div>

          {/* Active Workstation view toggle block */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden p-6 space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-600 shrink-0" /> Active Slide Workspace
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Edit personal deliverables, author new course slides, or claim next tasks in real-time pools.</p>
              </div>

              {/* Segmented active switch */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setWorkstationView('mine')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition font-display cursor-pointer ${
                    workstationView === 'mine'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  My Slide Board ({mySlides.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWorkstationView('all-pool');
                    if (!newSlideProject && projects.length > 0) {
                      setNewSlideProject(projects[0].id);
                    }
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition font-display cursor-pointer relative ${
                    workstationView === 'all-pool'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  All Project Slides Pool ({slides.length})
                  {slides.filter(s => !s.assignedEmployeeId).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* -------------------------------------------------------------
                VIEW A: MY ASSIGNED SLIDES
                ------------------------------------------------------------- */}
            {workstationView === 'mine' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mySlides.map(slide => {
                  const isEditing = editingSlideId === slide.id;
                  const associatedProj = projects.find(p => p.id === slide.projectId);

                  return (
                    <div key={slide.id} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col justify-between">
                      <div className="space-y-3">
                        
                        {/* Title Bar */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-slate-400">Project: <strong className="text-slate-600">{associatedProj?.projectName || 'General Study'}</strong></p>
                            <h4 className="text-xs font-extrabold text-slate-800 font-display">{slide.slideName}</h4>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold select-none uppercase ${
                            slide.status === 'Good to Go' ? 'bg-indigo-100 text-indigo-800' :
                            slide.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            slide.status === 'Client Review' ? 'bg-yellow-50 text-yellow-800' :
                            slide.status === 'Internal Review' ? 'bg-indigo-50 text-indigo-850' :
                            slide.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {slide.status}
                          </span>
                        </div>

                        {/* Read only info block */}
                        {!isEditing ? (
                          <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <p className="text-[9px] font-bold text-[#64748B] uppercase">Words Count</p>
                                <p className="font-semibold text-[#1E293B] font-mono">{slide.wordsCount} words</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-[#64748B] uppercase">Graded Quality</p>
                                <p className="font-bold text-emerald-600">{slide.qualityScore > 0 ? `${slide.qualityScore}%` : 'Not Graded'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-[#64748B] uppercase">Task Start</p>
                                <p className="text-[#475569]">{slide.startDate}</p>
                              </div>
                            </div>

                            {slide.outputLink ? (
                              <div className="pt-2">
                                <p className="text-[9px] font-bold text-[#64748B] uppercase">Registered Output Link</p>
                                <a
                                  href={slide.outputLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-650 font-semibold hover:underline bg-white px-2 py-1 rounded border border-slate-150 mt-1"
                                >
                                  <Globe className="w-3 h-3 text-emerald-500" /> Verify Project Assets
                                </a>
                              </div>
                            ) : (
                              <p className="text-[10px] text-[#94A3B8] select-none italic pt-1">
                                * Output submission link is blank. Add a link to complete.
                              </p>
                            )}

                            {slide.createdByUserName && (
                              <div className="pt-2 border-t border-dashed border-slate-200 text-[10px] text-slate-400">
                                Author: <span className="font-bold text-slate-500">{slide.createdByUserName}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // EDIT FORM MODULE FOR SLIDES
                          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#64748B] uppercase">Current Stage</label>
                                <select
                                  value={slideStatus}
                                  onChange={(e) => setSlideStatus(e.target.value as SlideStatus)}
                                  className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 outline-none text-slate-700"
                                >
                                  <option value="Not Started">Not Started</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Internal Review">Internal Review</option>
                                  <option value="Client Review">Client Review</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#64748B] uppercase">Actual Words Count</label>
                                <input
                                  type="number"
                                  required
                                  value={wordsCount}
                                  onChange={(e) => setWordsCount(Number(e.target.value))}
                                  className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 text-slate-705 outline-none font-mono"
                                />
                              </div>
                            </div>

                            {/* Completion percent slider matching mandate specifications */}
                            <div className="space-y-1 bg-white p-2.5 rounded border border-slate-100">
                              <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded">
                                <label className="text-[9px] font-bold text-[#475569] uppercase flex items-center gap-1">
                                  <Percent className="w-3 h-3 text-[#16A34A]" /> Completion Progress
                                </label>
                                <span className="font-bold text-xs text-[#16A34A] font-mono">{completionPct}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={completionPct}
                                onChange={(e) => setCompletionPct(Number(e.target.value))}
                                className="w-full accent-emerald-650 h-1 rounded cursor-pointer mt-1"
                              />
                              <p className="text-[8px] text-slate-400 select-none">
                                * Setting to 100% will automatically log slide as Completed.
                              </p>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#64748B] uppercase">Output Submission Link</label>
                              <input
                                type="url"
                                value={outputLink}
                                onChange={(e) => setOutputLink(e.target.value)}
                                placeholder="https://docs.google.com/presentation/..."
                                className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 text-xs text-slate-705 outline-none"
                              />
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Action buttons row */}
                      <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-end gap-2">
                        {!isEditing ? (
                          slide.isCombined ? (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 font-mono uppercase">
                              ✓ Slide Combined
                            </span>
                          ) : slide.status === 'Good to Go' ? (
                            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 font-mono uppercase">
                              ✓ Good to Go (Approved)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleStartUpdate(slide)}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition cursor-pointer font-display"
                            >
                              Modify Workspace
                            </button>
                          )
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingSlideId(null)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                            >
                              Discard
                            </button>
                            <button
                              onClick={() => handleSaveSlideProgress(slide.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition font-display cursor-pointer"
                            >
                              Lock Changes
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })}

                {mySlides.length === 0 && (
                  <div className="text-center py-12 text-[#94A3B8] col-span-2">
                    <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2 animate-bounce" />
                    <p className="text-sm font-semibold text-[#475569]">No active slide assignments</p>
                    <p className="text-xs text-slate-450 mt-1">Assignments will appear here once registered, or you can claim open slides from corporate pools!</p>
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------------
                VIEW B: CORPORATE ALL SLIDES & OPEN POOL
                ------------------------------------------------------------- */}
            {workstationView === 'all-pool' && (
              <div className="space-y-6">
                
                {/* Search, Filter, and "+ Add Slide" row */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-60">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search slides in pool..."
                        value={poolSearchQuery}
                        onChange={(e) => setPoolSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 transition font-medium text-slate-755"
                      />
                    </div>

                    <select
                      value={poolProjectFilter}
                      onChange={(e) => setPoolProjectFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-700 cursor-pointer"
                    >
                      <option value="all">📁 All Active Corporate Files</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.projectName}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSlideForm(!showAddSlideForm);
                      if (!newSlideProject && projects.length > 0) {
                        setNewSlideProject(projects[0].id);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition hover:scale-[1.01] cursor-pointer font-display"
                  >
                    <Plus className="w-4 h-4" />
                    {showAddSlideForm ? 'Hide Slide Editor' : 'Author & Publish Slide'}
                  </button>
                </div>

                {/* SLIDE CREATION FORM FOR EMPLOYEES */}
                {showAddSlideForm && (
                  <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 shadow-xs transition-all space-y-4">
                    <div className="border-b border-emerald-200 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 font-display">Author Project Deliverable</h4>
                      <p className="text-[10px] text-emerald-600">This adds the slide dynamically to the collective repository. All employees will immediately see it.</p>
                    </div>

                    <form onSubmit={handleEmployeeAddSlide} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Course File Project</label>
                        <select
                          value={newSlideProject}
                          onChange={(e) => setNewSlideProject(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none"
                        >
                          {projects.map(proj => (
                            <option key={proj.id} value={proj.id}>{proj.projectName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Deliverable Slide Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Slide 05: Customer Success Scenario"
                          value={newSlideName}
                          onChange={(e) => setNewSlideName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block flex justify-between">
                          <span>Story Board Words</span>
                          <span className="font-mono text-emerald-755 font-bold">{newSlideWords} words</span>
                        </label>
                        <input
                          type="number"
                          required
                          min={20}
                          max={5000}
                          value={newSlideWords}
                          onChange={(e) => setNewSlideWords(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-none font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2 pb-2 h-10 select-none">
                        <input
                          type="checkbox"
                          id="assignToMe"
                          checked={newSlideAssignToMe}
                          onChange={(e) => setNewSlideAssignToMe(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="assignToMe" className="text-[11px] font-black text-slate-700 cursor-pointer">
                          Assign & claim instantly
                        </label>
                      </div>

                      <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-emerald-100">
                        <button
                          type="button"
                          onClick={() => setShowAddSlideForm(false)}
                          className="px-3.5 py-1.5 bg-[#E2E8F0] text-[#475569] text-xs font-semibold rounded hover:bg-[#CBD5E1] transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition font-display cursor-pointer"
                        >
                          Confirm & Publish Scope
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* POOL LISTING GROUPED BY ACTIVE PROJECTS */}
                <div className="space-y-5">
                  {projects
                    .filter(p => poolProjectFilter === 'all' || p.id === poolProjectFilter)
                    .map((proj) => {
                      const projSlides = slides.filter(s => s.projectId === proj.id && (
                        s.slideName.toLowerCase().includes(poolSearchQuery.toLowerCase()) ||
                        (s.createdByUserName && s.createdByUserName.toLowerCase().includes(poolSearchQuery.toLowerCase()))
                      ));

                      return (
                        <div key={proj.id} className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-xs">
                          {/* Project Header Banner */}
                          <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Project File Header</span>
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-[#E2E8F0] text-[#334155] rounded-md uppercase">{proj.projectType}</span>
                              </div>
                              <h4 className="text-xs font-extrabold text-slate-800 font-display mt-0.5">{proj.projectName}</h4>
                            </div>

                            <span className="text-[10px] text-slate-500 font-mono">
                              Required Weight: <strong className="text-slate-700">{projSlides.reduce((acc, curr) => acc + curr.wordsCount, 0)} words</strong>
                            </span>
                          </div>

                          {/* Slide Items List */}
                          <div className="divide-y divide-slate-100">
                            {projSlides.length === 0 ? (
                              <p className="p-4 text-center text-slate-400 italic text-[11px] bg-slate-50/20">
                                No slides found matching the filters or defined under this file scope.
                              </p>
                            ) : (
                              projSlides.map((slide) => {
                                const isUnassigned = !slide.assignedEmployeeId;
                                const isAssignedToMe = slide.assignedEmployeeId === currentUser.id;
                                const assigneeName = users.find(u => u.id === slide.assignedEmployeeId)?.name || 'Unassigned';

                                return (
                                  <div key={slide.id} className="p-4 hover:bg-slate-50/25 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h5 className="text-[11.5px] font-bold text-slate-850 font-display">{slide.slideName}</h5>
                                        <span className={`px-2 py-0.2 text-[8px] font-black uppercase rounded-md tracking-wider ${
                                          slide.status === 'Good to Go' ? 'bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100' :
                                          slide.status === 'Completed' ? 'bg-[#DCFCE7] text-[#16A34A] border border-emerald-100' :
                                          slide.status === 'In Progress' ? 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-100' :
                                          'bg-slate-100 text-[#475569] border border-slate-200'
                                        }`}>
                                          {slide.status}
                                        </span>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-450 font-mono">
                                        <span>Words: <strong className="text-slate-600 font-bold">{slide.wordsCount}</strong></span>
                                        <span>•</span>
                                        <span>Added by: <strong className="text-emerald-700 font-bold">{slide.createdByUserName || 'Built-in Syllabus'}</strong></span>
                                        <span>•</span>
                                        <span>Assignee: {isUnassigned ? (
                                          <span className="text-[#D97706] font-bold bg-[#FEF3C7] px-1.5 py-0.5 rounded border border-[#FDE68A]">Open Pool 🟢</span>
                                        ) : (
                                          <span className="text-[#334155] font-semibold">{assigneeName} {isAssignedToMe ? '(You)' : ''}</span>
                                        )}</span>
                                      </div>
                                    </div>

                                    {/* Action Column */}
                                    <div>
                                      {isUnassigned ? (
                                        <button
                                          type="button"
                                          onClick={() => handleClaimSlide(slide.id)}
                                          className="px-4 py-1.5 bg-[#DCFCE7] hover:bg-emerald-100 text-[#16A34A] font-bold text-xs rounded-xl border border-emerald-150 transition cursor-pointer font-display shadow-xs"
                                        >
                                          Take Slide Deliverable
                                        </button>
                                      ) : isAssignedToMe ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setWorkstationView('mine');
                                            setEditingSlideId(slide.id);
                                            handleStartUpdate(slide);
                                          }}
                                          className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer font-display"
                                        >
                                          Mark Progress
                                        </button>
                                      ) : (
                                        <span className="text-[9px] text-[#64748B] bg-[#F1F5F9] px-2 py-1 rounded border border-[#E2E8F0] font-black uppercase tracking-wider select-none">
                                          Unavailable
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

              </div>
            )}

          </div>

          {/* Gemini Summary section */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 font-display">Personal AI Performance Evaluator</h3>
            <p className="text-xs text-slate-500">Formulate draft targets and calculate quarterly career trajectories using Gemini AI</p>
            
            <GeminiAISummarizer 
              action="generate-employee-summary"
              payload={{ employee: myLeaderboardStat }}
              buttonLabel="Diagnose My Career Roadmaps with Gemini"
            />
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 2: LEADERBOARD
          ------------------------------------------------------------- */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5">
              <Trophy className="w-5 h-5 text-yellow-500" /> Monthly Leaderboard rankings ({selectedMonth})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Real-time dynamic weights</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse text-center">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-3 text-left">Ranking</th>
                  <th className="px-3 py-3">Completed Slides</th>
                  <th className="px-3 py-3">Words count</th>
                  <th className="px-3 py-3">Graded Quality</th>
                  <th className="px-3 py-3">Attendance</th>
                  <th className="px-3 py-3 text-right">Engine Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((record, index) => {
                  const isMe = record.userId === currentUser.id;
                  return (
                    <tr key={record.userId} className={`border-b border-slate-50 hover:bg-slate-50/50 ${isMe ? 'bg-emerald-50/40 text-emerald-950 font-semibold' : ''}`}>
                      <td className="px-3 py-4 text-left font-bold flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-slate-100 text-slate-700' :
                          index === 2 ? 'bg-orange-100 text-orange-850' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="truncate">
                          <p className="truncate text-slate-850">{record.name} {isMe ? '(You)' : ''}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-normal">{record.userId}</p>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-600">{record.slidesCompleted} completed</td>
                      <td className="px-3 py-4 text-slate-600 font-mono">{record.wordsProduced} words</td>
                      <td className="px-3 py-4 text-emerald-700 font-bold">{record.avgQualityScore}%</td>
                      <td className="px-3 py-4 text-slate-500 font-mono">{record.attendancePercentage}%</td>
                      <td className="px-3 py-4 text-right text-emerald-600 font-black font-mono">{record.performanceScore} pts</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 3: ATTENDANCE
          ------------------------------------------------------------- */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 font-display">
              <Calendar className="w-5 h-5 text-emerald-600" /> Attendance logs and Leave registry
            </h3>
            <span className="text-xs text-slate-400">Total days logged: {myTotalWorkingDays} days</span>
          </div>

          {/* Leave balance counters */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-55 p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attendance Pct</span>
              <span className="text-xl font-black text-emerald-600 font-mono">{myAttendancePercentage}%</span>
            </div>
            
            <div className="bg-slate-55 p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Leaves Taken</span>
              <span className="text-xl font-bold text-slate-800 font-mono">{myUsedLeaves} days</span>
            </div>

            <div className="bg-slate-55 p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Available Balance</span>
              <span className="text-xl font-bold text-emerald-750 font-mono">{myLeaveBalance} days</span>
            </div>
          </div>

          {/* Simple calendar output grids */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Punch Log Ledger ({selectedMonth})</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
              {myAttendance.map(day => (
                <div key={day.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">{day.date.split('-').slice(1).join('/')}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    day.code === 'P' ? 'bg-emerald-100 text-emerald-800' :
                    day.code === 'H' ? 'bg-slate-205 text-slate-600' :
                    day.code === 'HD' ? 'bg-blue-100/80 text-blue-800' :
                    day.code === 'CL' ? 'bg-orange-100 text-orange-900' : 'bg-red-100 text-red-900'
                  }`}>
                    {day.code === 'P' ? 'Present' :
                     day.code === 'H' ? 'Holiday' :
                     day.code === 'HD' ? 'Half Day' :
                     day.code === 'CL' ? 'Casual' : 'Sick'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed recorded shifts list */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Clock className="w-4 h-4 text-emerald-600 animate-spin" style={{ animationDuration: '3s' }} /> Recorded Workstation Timing History
            </h4>
            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Punched In</th>
                    <th className="px-4 py-3">Punched Out</th>
                    <th className="px-4 py-3 text-right">Active Session Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myPunches.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                        No workstation timings recorded yet. Punches are automatically logged when logging in or using the workspace Station.
                      </td>
                    </tr>
                  ) : (
                    myPunches.map((p) => {
                      const displayDate = new Date(p.punchIn).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                      });
                      const inTime = new Date(p.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const outTime = p.punchOut 
                        ? new Date(p.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : null;

                      // Calculate duration
                      let elapsed = '--';
                      if (p.punchOut) {
                        const diffMs = new Date(p.punchOut).getTime() - new Date(p.punchIn).getTime();
                        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        elapsed = `${diffHrs}h ${diffMins}m`;
                      } else {
                        elapsed = 'In Progress (Active)';
                      }

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-250">{displayDate}</td>
                          <td className="px-4 py-3 text-emerald-600 font-mono font-semibold">{inTime}</td>
                          <td className="px-4 py-3 font-mono font-semibold dark:text-slate-350">
                            {outTime ? (
                              <span className="text-slate-500">{outTime}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wider rounded-md border border-emerald-100/30 animate-pulse">
                                Active Now
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-705 dark:text-slate-200 font-mono">
                            {elapsed}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 4: COMBINE WORKSPACE (NEW FEATURE)
          ------------------------------------------------------------- */}
      {activeTab === 'combine' && (() => {
        // Compute dynamically for the combination ledger
        const combinedMembers = users.map(user => {
          const count = slides.filter(s => s.isCombined && s.combinedByUserId === user.id).length;
          return { id: user.id, name: user.name, count };
        }).filter(item => item.count > 0);

        const totalCombinedSlides = slides.filter(s => s.isCombined).length;
        const totalPendingSlidesAll = slides.filter(s => !s.isCombined).length;

        if (selectedCombineProj === null) {
          return (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-600" /> Deliverables Consolidator & Combiner
                  </h1>
                  <p className="text-xs text-slate-500">Combine individual storyboard slides into cumulative master client files</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">Global Consolidation</span>
                  <span className="bg-emerald-600 text-white font-mono text-xs font-bold px-2.5 py-0.5 rounded-md">
                    {totalCombinedSlides} Consolidated
                  </span>
                </div>
              </div>

              {/* CONSTRUCTIVE FEEDBACK: WHO IS COMBINING LEDGER */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-display">Combination Activity Ledger</h3>
                    <p className="text-[10px] text-slate-400">Total slides currently successfully processed and combined by each author</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Pending Total: <strong className="text-amber-600 font-bold">{totalPendingSlidesAll} elements</strong>
                  </span>
                </div>

                {combinedMembers.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200/60">
                    <span className="text-emerald-500">
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <p className="text-xs text-slate-500 font-medium">
                      No slides combined yet. When an employee combines completed slides under any active course, their stats will appear on this board!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {combinedMembers.map(member => (
                      <div key={member.id} className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-100/50 flex justify-between items-center">
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-850 truncate">{member.name}</p>
                          <p className="text-[9px] text-slate-450 uppercase font-mono font-bold">Consolidation Agent</p>
                        </div>
                        <span className="bg-emerald-600 text-white font-mono text-xs font-extrabold px-2.5 py-1 rounded-md">
                          {member.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LIST OF ACTIVE COURSE FILES / PROJECTS */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 font-display">Select active Project File to Combine</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map(proj => {
                    const projSlides = slides.filter(s => s.projectId === proj.id);
                    const totalS = projSlides.length;
                    const completedS = projSlides.filter(s => s.status === 'Completed').length;
                    const combinedS = projSlides.filter(s => s.isCombined).length;
                    const pendingS = totalS - combinedS;

                    return (
                      <div key={proj.id} className="p-5 border border-slate-150 rounded-xl hover:border-slate-300 transition-all flex flex-col justify-between bg-slate-50/30">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-200 text-slate-600 rounded uppercase font-mono">{proj.projectType}</span>
                              <h4 className="text-xs font-extrabold text-slate-850 font-display mt-1.5">{proj.projectName}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">Under management of: <strong className="text-slate-600">{proj.clientName}</strong></p>
                            </div>

                            <span className="text-[10px] font-mono text-slate-500">
                              Version {proj.version}
                            </span>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-slate-150 text-xs">
                            <div className="grid grid-cols-3 gap-2 text-center bg-white p-2 rounded-lg border border-slate-100">
                              <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Total Slides</p>
                                <p className="font-extrabold text-slate-800 font-mono">{totalS}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Completed</p>
                                <p className="font-extrabold text-emerald-600 font-mono">{completedS}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Combined</p>
                                <p className="font-extrabold text-indigo-600 font-mono">{combinedS}</p>
                              </div>
                            </div>

                            {/* Pending details badge */}
                            <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-[#FEF3C7] text-[#D97706] rounded font-medium border border-[#FDE68A]/60">
                              <span>Pending combination:</span>
                              <span className="font-bold font-mono">{pendingS} slides</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedCombineProj(proj.id)}
                            className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-bold text-xs transition cursor-pointer font-display"
                          >
                            Open Combine Station
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        }

        // View single project combination details
        const selectedProj = projects.find(p => p.id === selectedCombineProj);
        const projSlides = slides.filter(s => s.projectId === selectedCombineProj);
        const totalS = projSlides.length;
        const completedS = projSlides.filter(s => s.status === 'Completed').length;
        const combinedS = projSlides.filter(s => s.isCombined).length;
        const pendingS = totalS - combinedS;

        return (
          <div className="space-y-6">
            
            {/* Header with back button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCombineProj(null)}
                  className="mb-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-display"
                >
                  &larr; Return to project folder list
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 font-display">
                    {selectedProj?.projectName}
                  </h1>
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 rounded-md font-mono">
                    {selectedProj?.version}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Client: <strong className="text-slate-700">{selectedProj?.clientName}</strong> • Type: <span className="font-semibold text-emerald-600">{selectedProj?.projectType}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-150 shrink-0 select-none">
                <div className="px-3">
                  <p className="text-[8px] font-black uppercase text-slate-400">Merged / Combined</p>
                  <p className="text-lg font-extrabold text-emerald-600 font-mono">{combinedS} / {totalS}</p>
                </div>
                <div className="px-3 border-l border-slate-200">
                  <p className="text-[8px] font-black uppercase text-slate-400">Total Pending</p>
                  <p className="text-lg font-extrabold text-amber-600 font-mono">{pendingS}</p>
                </div>
              </div>
            </div>

            {/* MANDATORY STRICT RULE CALLOUT */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 items-start">
              <span className="p-1 px-1.5 bg-emerald-600 text-white rounded-md text-xs font-black select-none uppercase font-mono shrink-0">Rule</span>
              <div>
                <p className="text-xs font-bold text-emerald-800">Syllabus Merging & Consolidation Protocol</p>
                <p className="text-[11px] text-emerald-600 mt-0.5 leading-relaxed">
                  Only slides successfully completed by their designers can be registered as combined into the core cumulative files. Slides currently set as <strong>'In Progress'</strong>, <strong>'Not Started'</strong>, or <strong>'Internal Review'</strong> are locked and cannot be processed as combined.
                </p>
              </div>
            </div>

            {/* SLIDES DETAILS TABLE */}
            <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">Asset Deliverable Elements</h3>
                <span className="text-[10px] text-slate-405">
                  Click Combine next to completed works to incorporate them.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3.5">Storyboard Slide Name</th>
                      <th className="px-5 py-3.5">Assigned Employee</th>
                      <th className="px-5 py-3.5">Substance Weight</th>
                      <th className="px-5 py-3.5">Production Stage</th>
                      <th className="px-5 py-3.5">Combination Status</th>
                      <th className="px-5 py-3.5 text-right">Process Option</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projSlides.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-400 italic text-[11px]">
                          No draft slide deliverables registered under this course file program.
                        </td>
                      </tr>
                    ) : (
                      projSlides.map(slide => {
                        const designer = users.find(u => u.id === slide.assignedEmployeeId)?.name || 'Unassigned';
                        const isSlideCompleted = slide.status === 'Completed';

                        return (
                          <tr key={slide.id} className="hover:bg-slate-50/30 transition text-xs">
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-850 font-display">{slide.slideName}</p>
                              <p className="text-[9px] text-slate-400 font-mono">ID: {slide.id}</p>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-700">
                              {designer}
                            </td>
                            <td className="px-5 py-4 font-mono font-bold text-slate-600">
                              {slide.wordsCount} words
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                slide.status === 'Good to Go' ? 'bg-indigo-100 text-indigo-850 dark:bg-indigo-950/40 dark:text-indigo-400' :
                                slide.status === 'Completed' ? 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                slide.status === 'In Progress' ? 'bg-blue-100 text-blue-750 dark:bg-blue-950/40 dark:text-blue-400' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400'
                              }`}>
                                {slide.status}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {slide.isCombined ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-emerald-100 uppercase select-none font-mono">
                                    Combined 🟢
                                  </span>
                                  <p className="text-[8px] text-slate-400 font-mono">
                                    by {slide.combinedByUserName} on {slide.combinedAt}
                                  </p>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase select-none font-mono">
                                  Pending 🟡
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              {slide.isCombined ? (
                                <span className="text-[10px] text-slate-400 italic">Consolidated ✓</span>
                              ) : slide.status === 'Good to Go' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    store.updateSlide(
                                      slide.id,
                                      {
                                        isCombined: true,
                                        combinedByUserId: currentUser.id,
                                        combinedByUserName: currentUser.name,
                                        combinedAt: new Date().toISOString().split('T')[0]
                                      },
                                      currentUser.id,
                                      currentUser.name
                                    );
                                    // Add alert notification for transparency
                                    store.addNotification({
                                      type: 'due_soon',
                                      title: 'Slide Combined',
                                      message: `${currentUser.name} successfully combined slide "${slide.slideName}" under project "${selectedProj?.projectName}"`,
                                      read: false
                                    });
                                  }}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition hover:scale-[1.01] cursor-pointer font-display"
                                >
                                  Combine Slide
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCombineAlertModal({
                                      isOpen: true,
                                      slideName: slide.slideName
                                    });
                                  }}
                                  className="px-3.5 py-1.5 bg-amber-550 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg border border-amber-400 transition hover:scale-[1.01] cursor-pointer"
                                  title="Click to process combining (requires Good to Go status)"
                                >
                                  Combine Slide
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Combine Alert Dialog Modal */}
            {combineAlertModal?.isOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col transform transition-transform duration-200 scale-100">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-amber-600">
                      <span className="p-2 bg-amber-50 rounded-full text-amber-600">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      </span>
                      <h3 className="text-sm font-black text-slate-900 font-display">Combination Locked</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">
                        You clicked <strong className="text-slate-900">"{combineAlertModal.slideName}"</strong>. However, the Team Leader or Admin has not marked this slide's progress as <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-805 rounded font-mono font-bold text-[10.5px]">Good to Go</span> yet.
                      </p>
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        "Team leader not allowed to combine this slide. You need to wait for Good to Go."
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCombineAlertModal(null)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Acknowledge & Wait
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      })()}

    </div>
  );
};

import React, { useState } from 'react';
import { User, Project, Slide, Attendance, PerformanceRecord, ProjectType, ProjectPriority, ProjectStatus, SlideStatus, AttendanceCode, PunchRecord } from '../types';
import { store } from '../db/store';
import { DashboardCharts } from './DashboardCharts';
import { GeminiAISummarizer } from './GeminiAISummarizer';
import { 
  Users, Briefcase, FileSpreadsheet, ClipboardList, TrendingUp, Calendar, 
  Search, Plus, Edit, Trash2, UserPlus, FileDown, Trophy, Medal, AlertTriangle, 
  CheckCircle2, Clock, PlayCircle, ExternalLink, HelpCircle, Save 
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  projects: Project[];
  slides: Slide[];
  attendance: Attendance[];
  punches?: PunchRecord[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  users,
  projects,
  slides,
  attendance,
  punches = []
}) => {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<'kpis' | 'employees' | 'projects' | 'attendance' | 'reports'>('kpis');

  // Search States
  const [empSearch, setEmpSearch] = useState('');
  const [projSearch, setProjSearch] = useState('');
  const [projTypeFilter, setProjTypeFilter] = useState<string>('all');
  const [punchSearch, setPunchSearch] = useState('');

  // Modal / Form States
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    role: 'employee' as 'admin' | 'employee',
    joiningDate: new Date().toISOString().split('T')[0],
    password: ''
  });

  const [showProjForm, setShowProjForm] = useState(false);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [projForm, setProjForm] = useState({
    projectName: '',
    clientName: '',
    version: 'v1.0',
    projectType: 'Storyline Course' as ProjectType,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    priority: 'medium' as ProjectPriority,
    status: 'Not Started' as ProjectStatus
  });

  const [showSlideForm, setShowSlideForm] = useState(false);
  const [activeProjForSlides, setActiveProjForSlides] = useState<string | null>(null);
  const [slideForm, setSlideForm] = useState({
    slideName: '',
    assignedEmployeeId: '',
    wordsCount: 100,
    status: 'Not Started' as SlideStatus,
    qualityScore: 90,
    outputLink: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  // Custom confirmation modal state to robustly handle iframe popup restrictions
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Selected Month for Leaderboard & Performer
  const [selectedMonth, setSelectedMonth] = useState('2026-06');

  // -------------------------------------------------------------
  // CALCULATED EXECUTIVE KPIs (Company-Wide Analytics)
  // -------------------------------------------------------------
  const employeesOnly = users.filter(u => u.role === 'employee' && u.status === 'active');
  const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
  const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;
  
  const completedSlidesYTD = slides.filter(s => s.status === 'Completed').length;
  const totalSlidesCount = slides.length;
  const totalWordsProduced = slides.filter(s => s.status === 'Completed').reduce((acc, curr) => acc + curr.wordsCount, 0);

  // Average quality of completed slides YTD
  const slidesWithGrades = slides.filter(s => s.status === 'Completed' && s.qualityScore > 0);
  const teamAverageQuality = slidesWithGrades.length > 0
    ? Math.round(slidesWithGrades.reduce((sum, s) => sum + s.qualityScore, 0) / slidesWithGrades.length)
    : 92;

  // Average attendance percentage
  const overallActiveAttendance = attendance.filter(a => a.date.startsWith(selectedMonth));
  const totalLogs = overallActiveAttendance.length;
  let teamAttendanceAvg = 98;
  if (totalLogs > 0) {
    const presentCount = overallActiveAttendance.filter(a => a.code === 'P').length;
    const holidayCount = overallActiveAttendance.filter(a => a.code === 'H').length;
    const halfDayCount = overallActiveAttendance.filter(a => a.code === 'HD').length;
    teamAttendanceAvg = Math.round(((presentCount + holidayCount + halfDayCount * 0.5) / totalLogs) * 100);
  }

  // Best Performer and Leaderboard
  const leaderboard = store.calculateLeaderboard(selectedMonth);
  const performerInfo = store.getPerformerOfTheMonth(selectedMonth);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name || !empForm.email) return;

    if (editingEmpId) {
      store.updateUser(editingEmpId, {
        name: empForm.name,
        email: empForm.email,
        role: empForm.role,
        joiningDate: empForm.joiningDate
      });
    } else {
      store.addUser({
        name: empForm.name,
        email: empForm.email,
        role: empForm.role,
        joiningDate: empForm.joiningDate,
        status: 'active',
        password: empForm.password || empForm.name.split(' ')[0].toLowerCase()
      });
    }

    // Reset Form
    setEmpForm({
      name: '',
      email: '',
      role: 'employee',
      joiningDate: new Date().toISOString().split('T')[0],
      password: ''
    });
    setEditingEmpId(null);
    setShowEmpForm(false);
  };

  const handleEditEmployeeClick = (emp: User) => {
    setEditingEmpId(emp.id);
    setEmpForm({
      name: emp.name,
      email: emp.email,
      role: emp.role,
      joiningDate: emp.joiningDate,
      password: emp.password || ''
    });
    setShowEmpForm(true);
  };

  const handleDeactivateEmployee = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Deactivate Employee Account',
      message: `Are you sure you want to deactivate employee "${name}"? This status can be reverted back to active later.`,
      onConfirm: () => store.deactivateUser(id)
    });
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projForm.projectName || !projForm.clientName) return;

    if (editingProjId) {
      store.updateProject(editingProjId, projForm);
    } else {
      store.addProject(projForm);
    }

    setProjForm({
      projectName: '',
      clientName: '',
      version: 'v1.0',
      projectType: 'Storyline Course',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      priority: 'medium',
      status: 'Not Started'
    });
    setEditingProjId(null);
    setShowProjForm(false);
  };

  const handleEditProjectClick = (proj: Project) => {
    setEditingProjId(proj.id);
    setProjForm({
      projectName: proj.projectName,
      clientName: proj.clientName,
      version: proj.version,
      projectType: proj.projectType,
      startDate: proj.startDate,
      dueDate: proj.dueDate,
      priority: proj.priority,
      status: proj.status
    });
    setShowProjForm(true);
  };

  const handleDeleteProject = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Project File',
      message: `Warning: Are you absolutely sure you want to delete "${name}"? This will permanently delete all associated slide deliverables and logs under this file.`,
      onConfirm: () => store.deleteProject(id)
    });
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.slideName || !activeProjForSlides) return;

    store.addSlide({
      projectId: activeProjForSlides,
      slideName: slideForm.slideName,
      assignedEmployeeId: slideForm.assignedEmployeeId || '',
      wordsCount: Number(slideForm.wordsCount),
      status: slideForm.status,
      qualityScore: Number(slideForm.qualityScore),
      outputLink: slideForm.outputLink,
      startDate: slideForm.startDate,
      endDate: slideForm.status === 'Completed' ? new Date().toISOString().split('T')[0] : '',
      duration: 0,
      createdByUserId: currentUser.id,
      createdByUserName: currentUser.name
    });

    setSlideForm({
      slideName: '',
      assignedEmployeeId: '',
      wordsCount: 100,
      status: 'Not Started',
      qualityScore: 90,
      outputLink: '',
      startDate: new Date().toISOString().split('T')[0]
    });
    setShowSlideForm(false);
  };

  const handleDeleteSlide = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Slide Deliverable',
      message: 'Are you sure you want to delete this slide assignment? This action cannot be undone.',
      onConfirm: () => store.deleteSlide(id)
    });
  };

  const handleGradeSlide = (slideId: string, score: number) => {
    store.updateSlide(slideId, { qualityScore: score }, currentUser.id, currentUser.name);
  };

  // -------------------------------------------------------------
  // DYNAMIC DATA EXPORTS (CSV Spreadsheet Format matching strict guideline)
  // -------------------------------------------------------------
  const exportCSV = (type: 'employees' | 'leaderboard' | 'projects') => {
    let csvContent = "";
    let fileName = "";

    if (type === 'employees') {
      fileName = `LearningGems_Employees_${selectedMonth}.csv`;
      csvContent += "Employee ID,Name,Email,Joining Date,Status,Role\n";
      users.forEach(e => {
        csvContent += `"${e.id}","${e.name}","${e.email}","${e.joiningDate}","${e.status}","${e.role}"\n`;
      });
    } 
    else if (type === 'leaderboard') {
      fileName = `LearningGems_Leaderboard_${selectedMonth}.csv`;
      csvContent += "Rank,Employee ID,Employee Name,Completed Slides,Words Produced,Avg Quality Score,Attendance %,Performance Score\n";
      leaderboard.forEach(r => {
        csvContent += `"${r.rank}","${r.userId}","${r.name}","${r.slidesCompleted}","${r.wordsProduced}","${r.avgQualityScore}%","${r.attendancePercentage}%","${r.performanceScore}"\n`;
      });
    } 
    else if (type === 'projects') {
      fileName = `LearningGems_Projects_YTD.csv`;
      csvContent += "Project ID,Project Name,Client Name,Version,Type,Priority,Due Date,Status\n";
      projects.forEach(p => {
        csvContent += `"${p.id}","${p.projectName}","${p.clientName}","${p.version}","${p.projectType}","${p.priority}","${p.dueDate}","${p.status}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable Summary (Client-Side PDF export fallback)
  const handlePrint = () => {
    window.print();
  };

  // -------------------------------------------------------------
  // FILTERS FOR LISTS
  // -------------------------------------------------------------
  const filteredEmployees = users.filter(u => 
    u.name.toLowerCase().includes(empSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(empSearch.toLowerCase()) ||
    u.id.toLowerCase().includes(empSearch.toLowerCase())
  );

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.projectName.toLowerCase().includes(projSearch.toLowerCase()) || p.clientName.toLowerCase().includes(projSearch.toLowerCase());
    const matchesType = projTypeFilter === 'all' || p.projectType === projTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Dynamic Sub Tabs Navigation Bar */}
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl shadow-sm gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('kpis')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg font-display shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'kpis'
              ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {activeSubTab === 'kpis' && <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />}
          <TrendingUp className="w-4 h-4" /> Company Analytics
        </button>
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg font-display shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'employees'
              ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {activeSubTab === 'employees' && <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />}
          <Users className="w-4 h-4" /> Employee Directory
        </button>
        <button
          onClick={() => setActiveSubTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg font-display shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'projects'
              ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {activeSubTab === 'projects' && <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />}
          <Briefcase className="w-4 h-4" /> Project Workspace
        </button>
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg font-display shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {activeSubTab === 'attendance' && <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />}
          <Calendar className="w-4 h-4" /> Attendance Registry
        </button>
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg font-display shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'reports'
              ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {activeSubTab === 'reports' && <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />}
          <FileSpreadsheet className="w-4 h-4" /> Executive Reports & AI
        </button>
      </div>

      {/* -------------------------------------------------------------
          SUB-TAB 1: COMPANY ANALYTICS (EXECUTIVE DASHBOARD)
          ------------------------------------------------------------- */}
      {activeSubTab === 'kpis' && (
        <div className="space-y-6">
          {/* Dashboard Meta Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 font-display">Executive Command Dashboard</h1>
              <p className="text-xs text-slate-500">Corporate tracking across active digital syllabi projects</p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Evaluation Window:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs font-medium px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-700"
              />
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Slides YTD</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800 font-display">{completedSlidesYTD} / {totalSlidesCount}</div>
              <span className="text-[10px] font-semibold text-emerald-600">Cleared Production</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Words YTD</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800 font-display">{totalWordsProduced.toLocaleString()}</div>
              <span className="text-[10px] font-semibold text-slate-500">Academic Copy Length</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Projects</span>
                <Briefcase className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800 font-display">{activeProjectsCount}</div>
              <span className="text-[10px] font-semibold text-slate-500">{completedProjectsCount} projects finished</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Average Quality</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800 font-display">{teamAverageQuality}%</div>
              <span className="text-[10px] font-semibold text-emerald-600">Strict Quality Standard</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm col-span-2 md:col-span-1">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Attendance %</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800 font-display">{teamAttendanceAvg}%</div>
              <span className="text-[10px] font-semibold text-slate-500">{selectedMonth} window average</span>
            </div>
          </div>

          {/* Core Calculation Charts Panel */}
          <DashboardCharts projects={projects} slides={slides} leaderboard={leaderboard} />

          {/* Performer of the Month Card layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gradient-to-br from-[#16A34A] to-[#15803D] text-white rounded-2xl overflow-hidden shadow-xl relative">
            <div className="absolute -right-4 -bottom-4 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Visual profile detail */}
            <div className="md:col-span-4 p-8 bg-black/10 flex flex-col items-center justify-center text-center relative z-10">
              <div className="absolute top-4 left-4 bg-white/15 px-3 py-1 rounded-full text-[10px] font-bold uppercase font-display select-none">
                Month Champion
              </div>
              
              {/* Photo representation circle */}
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/40 mb-4 text-white font-extrabold text-2xl shadow-inner font-display select-none">
                {performerInfo.winner.name.split(' ').map(n=>n[0]).join('')}
              </div>

              <h2 className="text-xl font-bold font-display">{performerInfo.winner.name}</h2>
              <p className="text-xs text-green-100 font-mono mb-2">{performerInfo.winner.id}</p>
              
              <div className="w-full bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase text-green-200 font-bold tracking-wider block">Performance Score</span>
                <span className="text-xl font-black font-mono text-white">{performerInfo.score} pts</span>
              </div>
            </div>

            {/* Explanatory data details */}
            <div className="md:col-span-8 p-8 flex flex-col justify-between space-y-4 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-yellow-300">
                  <Trophy className="w-5 h-5 text-yellow-300" />
                  <span className="text-xs font-bold uppercase tracking-wider font-display">Calculated Best Performer</span>
                </div>
                
                <h3 className="text-xl font-bold font-display">Outstanding Delivery Metrics</h3>
                
                <p className="text-sm text-green-50 leading-relaxed font-sans italic">
                  "{performerInfo.reason}"
                </p>
              </div>

              {/* Grid indices */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/20 text-center">
                <div className="bg-white/10 p-2.5 rounded-lg border border-white/5">
                  <div className="text-base font-bold font-mono text-white">{performerInfo.slides}</div>
                  <div className="text-[9px] text-green-100">Slides Finished</div>
                </div>
                <div className="bg-white/10 p-2.5 rounded-lg border border-white/5">
                  <div className="text-base font-bold font-mono text-white">{performerInfo.words}</div>
                  <div className="text-[9px] text-green-100 font-display">Words Produced</div>
                </div>
                <div className="bg-white/10 p-2.5 rounded-lg border border-white/5">
                  <div className="text-base font-bold font-mono text-white">{performerInfo.quality}%</div>
                  <div className="text-[9px] text-green-100">Avg Quality</div>
                </div>
                <div className="bg-white/10 p-2.5 rounded-lg border border-white/5">
                  <div className="text-base font-bold font-mono text-white">{performerInfo.attendance}%</div>
                  <div className="text-[9px] text-green-100 font-mono">Punctuality %</div>
                </div>
              </div>

              {/* Predictive AI generator */}
              <div className="pt-2">
                <GeminiAISummarizer 
                  action="predict-best-performer" 
                  payload={{ selectedMonth, leaderboard }} 
                  buttonLabel="Predict Competitor Performance Scores with Gemini"
                />
              </div>

            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 2: EMPLOYEE DIRECTORY (ADMIN WORKSPACE)
          ------------------------------------------------------------- */}
      {activeSubTab === 'employees' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-display">Employee Administration Directory</h2>
              <p className="text-xs text-slate-500">Edit, register, or de-register learning content engineers</p>
            </div>

            <button
              onClick={() => {
                setEditingEmpId(null);
                setEmpForm({
                  name: '',
                  email: '',
                  role: 'employee',
                  joiningDate: new Date().toISOString().split('T')[0],
                  password: ''
                });
                setShowEmpForm(true);
              }}
              id="btn-add-emp"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm font-display cursor-pointer transition"
            >
              <UserPlus className="w-4 h-4" /> Add New Employee
            </button>
          </div>

          {/* Form Modal (Modal overlay or inline panel) */}
          {showEmpForm && (
            <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 transition-all">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                {editingEmpId ? '📝 Edit Profile' : '👥 Register New Core Employee'}
              </h3>
              
              <form onSubmit={handleSaveEmployee} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Full Name</label>
                  <input
                    type="text"
                    required
                    value={empForm.name}
                    onChange={(e)=>setEmpForm({...empForm, name: e.target.value})}
                    placeholder="e.g. Akhil R Krishnan"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Company Email address</label>
                  <input
                    type="email"
                    required
                    value={empForm.email}
                    onChange={(e)=>setEmpForm({...empForm, email: e.target.value})}
                    placeholder="name@learninggems.com"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Authorization Password</label>
                  <input
                    type="text"
                    value={empForm.password}
                    onChange={(e)=>setEmpForm({...empForm, password: e.target.value})}
                    placeholder={editingEmpId ? 'Leave blank to keep same' : 'e.g. akhil123'}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={empForm.joiningDate}
                    onChange={(e)=>setEmpForm({...empForm, joiningDate: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmpForm(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-300 transition"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition"
                  >
                    Save profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Directory lists & filters */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            {/* Search filters */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff Name or ID..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 outline-none rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-xs ml-auto">
                <span>Active employees count: <strong className="text-slate-800">{employeesOnly.length}</strong></span>
                <button
                  type="button"
                  onClick={() => exportCSV('employees')}
                  className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded hover:bg-emerald-100 transition"
                >
                  <FileDown className="w-3.5 h-3.5" /> Export csv
                </button>
              </div>
            </div>

            {/* Grid display */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-55 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Email Address</th>
                    <th className="px-5 py-3">Register status</th>
                    <th className="px-5 py-3">Joining Date</th>
                    <th className="px-5 py-3">Access Level</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 font-extrabold text-[10px] flex items-center justify-center text-slate-700 uppercase">
                            {emp.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono font-semibold">{emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">{emp.email}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                          emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{emp.joiningDate}</td>
                      <td className="px-5 py-4">
                        <span className="text-slate-700 font-bold uppercase text-[10px]">{emp.role}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditEmployeeClick(emp)}
                            className="p-1 hover:bg-slate-100 text-slate-500 rounded transition"
                            title="Edit Employee Detail"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {emp.role !== 'admin' && emp.status === 'active' && (
                            <button
                              onClick={() => handleDeactivateEmployee(emp.id, emp.name)}
                              className="p-1 hover:bg-red-50 text-red-600 rounded transition"
                              title="Deactivate Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No employees found matching the query criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI summaries section */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 font-display">Employee Pipeline AI Coach</h3>
            <p className="text-xs text-slate-500">Pick any active teammate profile to synthesize a career roadmap with Gemini AI</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {employeesOnly.map(emp => (
                <GeminiAISummarizer
                  key={emp.id}
                  action="generate-employee-summary"
                  payload={{ employee: leaderboard.find(l => l.userId === emp.id) || emp }}
                  buttonLabel={`Review ${emp.name.split(' ')[0]}`}
                />
              ))}
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 3: PROJECT WORKSPACE (ADMIN CREATOR PANEL)
          ------------------------------------------------------------- */}
      {activeSubTab === 'projects' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-display">Project Workspace Board</h2>
              <p className="text-xs text-slate-500">Define digital curricula, coordinate timelines, and assign slides</p>
            </div>

            <button
              onClick={() => {
                setEditingProjId(null);
                setProjForm({
                  projectName: '',
                  clientName: '',
                  version: 'v1.0',
                  projectType: 'Storyline Course',
                  startDate: new Date().toISOString().split('T')[0],
                  dueDate: '',
                  priority: 'medium',
                  status: 'Not Started'
                });
                setShowProjForm(true);
              }}
              id="btn-add-proj"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm font-display cursor-pointer transition"
            >
              <Plus className="w-4 h-4" /> Create Project
            </button>
          </div>

          {/* Project Form Drawer */}
          {showProjForm && (
            <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 transition-all">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                {editingProjId ? '📝 Edit Project Variables' : '📁 Setup New Digital Syllabus Project'}
              </h3>

              <form onSubmit={handleSaveProject} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Project Name</label>
                  <input
                    type="text"
                    required
                    value={projForm.projectName}
                    onChange={(e)=>setProjForm({...projForm, projectName: e.target.value})}
                    placeholder="e.g. Compliance Lecture YTD"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 z-10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Client Name</label>
                  <input
                    type="text"
                    required
                    value={projForm.clientName}
                    onChange={(e)=>setProjForm({...projForm, clientName: e.target.value})}
                    placeholder="e.g. Modern Learning Inc"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">File version</label>
                  <input
                    type="text"
                    required
                    value={projForm.version}
                    onChange={(e)=>setProjForm({...projForm, version: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Project Type</label>
                  <select
                    value={projForm.projectType}
                    onChange={(e)=>setProjForm({...projForm, projectType: e.target.value as ProjectType})}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  >
                    <option value="Storyline Course">Storyline Course</option>
                    <option value="Rise Course">Rise Course</option>
                    <option value="Motion Graphics">Motion Graphics</option>
                    <option value="Compliance Training">Compliance Training</option>
                    <option value="Hospitality Training">Hospitality Training</option>
                    <option value="Promo Video">Promo Video</option>
                    <option value="Animation">Animation</option>
                    <option value="AI Course">AI Course</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Start Date</label>
                  <input
                    type="date"
                    required
                    value={projForm.startDate}
                    onChange={(e)=>setProjForm({...projForm, startDate: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Due Date (Client Committed)</label>
                  <input
                    type="date"
                    required
                    value={projForm.dueDate}
                    onChange={(e)=>setProjForm({...projForm, dueDate: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Priority</label>
                  <select
                    value={projForm.priority}
                    onChange={(e)=>setProjForm({...projForm, priority: e.target.value as ProjectPriority})}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Status</label>
                  <select
                    value={projForm.status}
                    onChange={(e)=>setProjForm({...projForm, status: e.target.value as ProjectStatus})}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowProjForm(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-300 transition"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition"
                  >
                    Confirm Scope
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Slide assignment Modal */}
          {showSlideForm && (
            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                🎯 Assign Slide/Component Asset: {projects.find(p => p.id === activeProjForSlides)?.projectName}
              </h3>
              
              <form onSubmit={handleSaveSlide} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Slide / Layout Scene Title</label>
                  <input
                    type="text"
                    required
                    value={slideForm.slideName}
                    onChange={(e)=>setSlideForm({...slideForm, slideName: e.target.value})}
                    placeholder="e.g. Quiz Section Scenario"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Assigned Developer</label>
                  <select
                    value={slideForm.assignedEmployeeId}
                    onChange={(e)=>setSlideForm({...slideForm, assignedEmployeeId: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700"
                  >
                    <option value="">-- Unassigned (Open Slide Pool) --</option>
                    {employeesOnly.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Expected Word Count (Weight)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={slideForm.wordsCount}
                    onChange={(e)=>setSlideForm({...slideForm, wordsCount: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Startup State</label>
                  <select
                    value={slideForm.status}
                    onChange={(e)=>setSlideForm({...slideForm, status: e.target.value as SlideStatus})}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Internal Review">Internal Review</option>
                    <option value="Client Review">Client Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowSlideForm(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition"
                  >
                    Assign Slide Asset
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Directory of Projects list */}
          <div className="grid grid-cols-1 gap-6">
            
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
              {/* Search interface */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search standard files, clients..."
                    value={projSearch}
                    onChange={(e)=>setProjSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 outline-none rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div>
                  <select
                    value={projTypeFilter}
                    onChange={(e)=>setProjTypeFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-xs font-medium px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-700"
                  >
                    <option value="all">All File Types</option>
                    <option value="Storyline Course">Storyline Course</option>
                    <option value="Rise Course">Rise Course</option>
                    <option value="Motion Graphics">Motion Graphics</option>
                    <option value="Compliance Training">Compliance Training</option>
                    <option value="Hospitality Training">Hospitality Training</option>
                    <option value="Promo Video">Promo Video</option>
                    <option value="Animation">Animation</option>
                    <option value="AI Course">AI Course</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => exportCSV('projects')}
                  className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 px-3 py-1 rounded text-xs ml-auto hover:bg-emerald-100 transition"
                >
                  <FileDown className="w-3.5 h-3.5" /> Export csv
                </button>
              </div>

              {/* Projects details matching 'Project Summary' mandate */}
              <div className="divide-y divide-slate-100">
                {filteredProjects.map(proj => {
                  const projSlides = slides.filter(s => s.projectId === proj.id);
                  const totalSlides = projSlides.length;
                  const completedS = projSlides.filter(s => s.status === 'Completed').length;
                  const inProgressS = projSlides.filter(s => s.status === 'In Progress').length;
                  const pendingS = totalSlides - completedS;
                  const totalWords = projSlides.reduce((acc, curr) => acc + curr.wordsCount, 0);

                  // Calculate Completion %
                  const completionPercentage = totalSlides > 0
                    ? Math.round((completedS / totalSlides) * 100)
                    : 0;

                  // Unique list of engineers assigned to this project
                  const assignedEmpIds = Array.from(new Set(projSlides.map(s => s.assignedEmployeeId)));
                  const assignedEmpNames = assignedEmpIds.map(id => users.find(u => u.id === id)?.name || id);

                  return (
                    <div key={proj.id} className="p-6 hover:bg-slate-50/20 transition duration-150">
                      
                      {/* Grid header row */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {proj.id}
                            </span>
                            <h3 className="text-sm font-bold text-slate-800 font-display">{proj.projectName}</h3>
                            <span className="text-[10px] font-semibold text-slate-400">Ver: {proj.version}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>Client: <strong className="text-slate-700 font-medium">{proj.clientName}</strong></span>
                            <span>•</span>
                            <span>Type: <strong className="text-emerald-700 font-medium">{proj.projectType}</strong></span>
                            <span>•</span>
                            <span>Commitment Due: <strong className="text-[#16A34A] font-medium">{proj.dueDate}</strong></span>
                          </div>
                        </div>

                        {/* Status flags */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            proj.priority === 'high' ? 'bg-red-50 text-red-600' :
                            proj.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                          }`}>
                            {proj.priority} priority
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            proj.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            proj.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {proj.status}
                          </span>

                          <div className="flex bg-slate-50 rounded-lg p-0.5 ml-2">
                            <button
                              onClick={() => {
                                setActiveProjForSlides(proj.id);
                                setShowSlideForm(true);
                              }}
                              className="p-1 hover:bg-white text-emerald-600 rounded transition"
                              title="Assign Slide to Project"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEditProjectClick(proj)}
                              className="p-1 hover:bg-white text-slate-500 rounded transition"
                              title="Edit variables"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.id, proj.projectName)}
                              className="p-1 hover:bg-red-50 text-red-600 rounded transition animate-pulse"
                              title="Delete project layout"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Summary Metrics row matching "PROJECT SUMMARY" specifications */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 text-xs">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Slides</p>
                          <p className="font-bold text-slate-800">{totalSlides}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Completed Slides</p>
                          <p className="font-bold text-emerald-600">{completedS}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">In Progress Slides</p>
                          <p className="font-bold text-blue-600">{inProgressS}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Slides</p>
                          <p className="font-bold text-slate-500">{pendingS}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Word Weight</p>
                          <p className="font-bold text-slate-700 font-mono">{totalWords} words</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Completion %</p>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-emerald-700">{completionPercentage}%</span>
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-600" style={{ width: `${completionPercentage}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Slides assignments list */}
                      {projSlides.length > 0 ? (
                        <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slide Task Deliverables</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {projSlides.map(slide => {
                              const workerName = users.find(u => u.id === slide.assignedEmployeeId)?.name || 'Unassigned';
                              return (
                                <div key={slide.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-xs flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`w-2 h-2 rounded-full ${
                                        slide.status === 'Good to Go' ? 'bg-indigo-600 animate-pulse' :
                                        slide.status === 'Completed' ? 'bg-emerald-500' :
                                        slide.status === 'Client Review' ? 'bg-yellow-500' :
                                        slide.status === 'Internal Review' ? 'bg-indigo-500' :
                                        slide.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'
                                      }`} />
                                      <p className="text-xs font-bold text-slate-800">{slide.slideName}</p>
                                      {slide.isCombined ? (
                                        <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[8px] font-bold rounded border border-emerald-100 font-mono" title={`Combined by ${slide.combinedByUserName} on ${slide.combinedAt}`}>
                                          Combined ✓
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-bold rounded border border-amber-100 font-mono" title="Pending cumulative merge">
                                          Pending Combine
                                        </span>
                                      )}
                                    </div>
                                    
                                    <p className="text-[10px] text-slate-500">
                                      Developer: <strong className="text-slate-700">{workerName}</strong> | Copy: <span className="font-mono">{slide.wordsCount} words</span>
                                    </p>

                                    {slide.outputLink && (
                                      <a
                                        href={slide.outputLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[9px] text-emerald-600 hover:underline"
                                      >
                                        <ExternalLink className="w-2.5 h-2.5" /> Output Link
                                      </a>
                                    )}
                                  </div>

                                  {/* Custom Status/Scoring for Admins */}
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase select-none ${
                                        slide.status === 'Good to Go' ? 'bg-indigo-550 text-white font-extrabold shadow-xs' :
                                        slide.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        {slide.status}
                                      </span>
                                    </div>

                                    {/* Action dropdown for updating Slide status */}
                                    <div className="flex items-center gap-1">
                                      <label className="text-[9px] text-slate-400 uppercase font-semibold">Stage:</label>
                                      <select
                                        value={slide.status}
                                        onChange={(e) => {
                                          const newStatus = e.target.value as any;
                                          store.updateSlide(slide.id, { status: newStatus }, currentUser.id, currentUser.name);

                                          // Create real activity log
                                          store.log(currentUser.id, currentUser.name, `Updated status of "${slide.slideName}" to [${newStatus}]`);

                                          // Add notification if status is updated to Good to Go
                                          if (newStatus === 'Good to Go') {
                                            store.addNotification({
                                              type: 'due_soon',
                                              title: 'Slide Approved: Good to Go',
                                              message: `Team Lead approved slide "${slide.slideName}" as "Good to Go". It is now ready for consolidation!`,
                                              read: false
                                            });
                                          }
                                        }}
                                        className={`text-[10px] font-bold border border-slate-200 outline-none rounded bg-slate-50 px-1.5 py-0.5 ${
                                          slide.status === 'Good to Go' ? 'text-indigo-700 font-extrabold bg-indigo-50 border-indigo-200' : 'text-slate-705'
                                        }`}
                                      >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Internal Review">Internal Review</option>
                                        <option value="Client Review">Client Review</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Good to Go">Good to Go</option>
                                      </select>
                                    </div>
                                    
                                    {(slide.status === 'Completed' || slide.status === 'Good to Go') && (
                                      <div className="flex items-center gap-1">
                                        <label className="text-[9px] text-slate-400 uppercase font-semibold">Grade:</label>
                                        <select
                                          value={slide.qualityScore}
                                          onChange={(e) => handleGradeSlide(slide.id, Number(e.target.value))}
                                          className="text-[10px] font-bold border border-slate-200 outline-none rounded bg-slate-50 px-1 py-0.5 text-emerald-855"
                                        >
                                          {[100, 98, 96, 95, 94, 92, 90, 85, 80, 75, 70, 60].map(s=> (
                                            <option key={s} value={s}>{s}%</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}

                                    <button
                                      onClick={() => handleDeleteSlide(slide.id)}
                                      className="text-red-500 hover:text-red-700 p-0.5 text-[9px] transition"
                                      title="Delete assignment"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 pl-4 border-l-2 border-slate-100 select-none italic">
                          No slides created. Press the '+' button to assign the first slide to an employee.
                        </p>
                      )}

                      {/* Gemini AI Summary Integration */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <GeminiAISummarizer 
                          action="generate-project-summary"
                          payload={{ project: proj, totalSlides, completedSlides: completedS, pendingSlides: pendingS, completionPercentage, wordsCount: totalWords }}
                          buttonLabel={`Generate AI Risk Assessment Report for ${proj.projectName.split(' ')[0]}`}
                        />
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Employee Slides Workload Summary Tracker */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-emerald-600" /> Employee Slide Allocation & Workload Monitor
                </h3>
                <p className="text-xs text-slate-500">Track how many slide deliverables each team member has taken/completed across all active files.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3 text-center">Slides Taken</th>
                    <th className="px-4 py-3 text-center">Completed Scenes</th>
                    <th className="px-4 py-3 text-center">In Progress</th>
                    <th className="px-4 py-3 text-center">Review Stages</th>
                    <th className="px-4 py-3 text-right">Estimated Words (Weight)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employeesOnly.map((emp) => {
                    const empSlides = slides.filter(s => s.assignedEmployeeId === emp.id);
                    const completedCount = empSlides.filter(s => s.status === 'Completed').length;
                    const inProgressCount = empSlides.filter(s => s.status === 'In Progress').length;
                    const reviewCount = empSlides.filter(s => s.status === 'Internal Review' || s.status === 'Client Review').length;
                    const totalWordsLogged = empSlides.reduce((acc, curr) => acc + curr.wordsCount, 0);

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-bold text-slate-800 font-display">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{emp.id} • {emp.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold bg-slate-100 rounded-full text-slate-700">
                            {empSlides.length} slides
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full ${
                            completedCount > 0 ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {completedCount}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                            inProgressCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {inProgressCount}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                            reviewCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {reviewCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-700 font-mono">
                          {totalWordsLogged.toLocaleString()} words
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 4: ATTENDANCE REGISTRY (ADMIN CONTROL PANEL)
          ------------------------------------------------------------- */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-display">Administrative Attendance Registry</h2>
              <p className="text-xs text-slate-500">Log daily punches: P=Present, CL=Casual Leave, SL=Sick Leave, HD=Half Day, H=Holiday</p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Target Range:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs font-medium px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-700 w-36"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 font-display border-b border-slate-100 pb-2">Active Month Registry</h3>
            
            {/* Grid of days for current month */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-3">Employee</th>
                    <th className="px-3 py-3">P</th>
                    <th className="px-3 py-3">CL</th>
                    <th className="px-3 py-3">SL</th>
                    <th className="px-3 py-3">HD</th>
                    <th className="px-3 py-3">H</th>
                    <th className="px-3 py-3 text-right">Attendance %</th>
                    <th className="px-3 py-3 text-right">Leave Balance</th>
                    <th className="px-3 py-3 text-right">Total Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employeesOnly.map(emp => {
                    const empLogs = attendance.filter(a => a.userId === emp.id && a.date.startsWith(selectedMonth));
                    const pCount = empLogs.filter(a => a.code === 'P').length;
                    const clCount = empLogs.filter(a => a.code === 'CL').length;
                    const slCount = empLogs.filter(a => a.code === 'SL').length;
                    const hdCount = empLogs.filter(a => a.code === 'HD').length;
                    const hCount = empLogs.filter(a => a.code === 'H').length;
                    const totalDaysCount = empLogs.length;

                    // Out of 24 annual leaves
                    const clSLUsage = attendance.filter(a => a.userId === emp.id && (a.code === 'CL' || a.code === 'SL')).length;
                    const balance = Math.max(24 - clSLUsage, 0);

                    const attPct = totalDaysCount > 0
                      ? Math.round(((pCount + hCount + hdCount * 0.5) / totalDaysCount) * 100)
                      : 100;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-4">
                          <div>
                            <p className="font-bold text-slate-800">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono font-semibold">{emp.id}</p>
                          </div>
                        </td>
                        
                        {/* Attendance Clickable selectors */}
                        <td className="px-3 py-4 font-mono font-bold text-slate-600">
                          <button 
                            onClick={() => store.logAttendance(emp.id, `${selectedMonth}-19`, 'P', currentUser.name)}
                            className="bg-slate-100 hover:bg-emerald-100 px-2 py-1 rounded text-slate-800 cursor-pointer text-[10px]"
                          >
                            P ({pCount})
                          </button>
                        </td>
                        <td className="px-3 py-4 font-mono font-bold text-slate-600">
                          <button 
                            onClick={() => store.logAttendance(emp.id, `${selectedMonth}-19`, 'CL', currentUser.name)}
                            className="bg-slate-100 hover:bg-orange-100 px-2 py-1 rounded text-orange-850 cursor-pointer text-[10px]"
                          >
                            CL ({clCount})
                          </button>
                        </td>
                        <td className="px-3 py-4 font-mono font-bold text-slate-600">
                          <button 
                            onClick={() => store.logAttendance(emp.id, `${selectedMonth}-19`, 'SL', currentUser.name)}
                            className="bg-slate-100 hover:bg-red-100 px-2 py-1 rounded text-red-850 cursor-pointer text-[10px]"
                          >
                            SL ({slCount})
                          </button>
                        </td>
                        <td className="px-3 py-4 font-mono font-bold text-slate-600">
                          <button 
                            onClick={() => store.logAttendance(emp.id, `${selectedMonth}-19`, 'HD', currentUser.name)}
                            className="bg-slate-100 hover:bg-blue-100 px-2 py-1 rounded text-blue-800 cursor-pointer text-[10px]"
                          >
                            HD ({hdCount})
                          </button>
                        </td>
                        <td className="px-3 py-4 font-mono font-bold text-slate-600">
                          <button 
                            onClick={() => store.logAttendance(emp.id, `${selectedMonth}-19`, 'H', currentUser.name)}
                            className="bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700 cursor-pointer text-[10px]"
                          >
                            H ({hCount})
                          </button>
                        </td>

                        {/* Calculated totals */}
                        <td className="px-3 py-4 text-right font-black font-mono text-emerald-600">{attPct}%</td>
                        <td className="px-3 py-4 text-right font-bold text-slate-700 font-mono">{balance} days</td>
                        <td className="px-3 py-4 text-right text-slate-400 font-mono">{totalDaysCount} logs</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              * Note: Pressing any attendance code buttons logs/updates a punch record for the *current evaluation date* (June 19, 2026 / target evaluation day), instantly shifting overall percentages on the graphs!
            </p>
          </div>

          {/* Real-time Employee timings track */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" /> Real-Time Shift Punch & Login Monitors
                </h3>
                <p className="text-xs text-slate-500">Live operational timetable of employee logins, timings, and active workstations</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search punch bar */}
                <span className="text-xs font-bold text-slate-500">Search:</span>
                <input
                  type="text"
                  placeholder="Filter by employee name..."
                  value={punchSearch}
                  onChange={(e) => setPunchSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-700 w-48"
                />
              </div>
            </div>

            {/* Quick statistics widgets for administrator */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#F1FDF4] rounded-xl border border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <span className="font-bold text-sm">✓</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Currently Punch-Active</span>
                  <span className="text-sm font-bold text-slate-800">
                    {punches.filter(p => p.status === 'active').length} employees active
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-150 flex items-center justify-center text-slate-700">
                  <span className="font-bold text-sm font-mono">#</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Recorded Timings YTD</span>
                  <span className="text-sm font-bold text-slate-800">
                    {punches.length} logged sessions
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#F1FDF4] rounded-xl border border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-mono">
                  ⏱
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Shift System Status</span>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-full inline-block mt-0.5 font-display">
                    PUNCH CONTROL ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Table layout of punches */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Employee Description</th>
                    <th className="px-4 py-3">Registration Date</th>
                    <th className="px-4 py-3">Punched In Time</th>
                    <th className="px-4 py-3">Punched Out Time</th>
                    <th className="px-4 py-3 text-right">Elapsed Session Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {punches.filter(p => 
                    p.userName.toLowerCase().includes(punchSearch.toLowerCase()) ||
                    p.userId.toLowerCase().includes(punchSearch.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                        No active employee timing logs match your search. As soon as employees sign into their dashboard portals, shift listings will populate here!
                      </td>
                    </tr>
                  ) : (
                    punches
                      .filter(p => 
                        p.userName.toLowerCase().includes(punchSearch.toLowerCase()) ||
                        p.userId.toLowerCase().includes(punchSearch.toLowerCase())
                      )
                      .map((p) => {
                        const punchInTime = new Date(p.punchIn).toLocaleString();
                        const punchOutTime = p.punchOut ? new Date(p.punchOut).toLocaleString() : null;
                        
                        let durationStr = '--';
                        if (p.punchOut) {
                          const diffMs = new Date(p.punchOut).getTime() - new Date(p.punchIn).getTime();
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          durationStr = `${hours}h ${minutes}m`;
                        } else {
                          durationStr = 'Active (In Progress)';
                        }

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-4">
                              <div>
                                <p className="font-bold text-slate-800">{p.userName}</p>
                                <p className="text-[10px] text-slate-400 font-mono font-semibold">{p.userId}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 font-medium text-slate-600">{p.date}</td>
                            <td className="px-4 py-4 text-emerald-700 font-bold font-mono">{punchInTime}</td>
                            <td className="px-4 py-4 font-mono font-semibold">
                              {punchOutTime ? (
                                <span className="text-slate-500">{punchOutTime}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-150 text-emerald-800 font-bold text-[9px] uppercase tracking-wider rounded border border-emerald-100/50 animate-pulse">
                                  Live Working Session
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className={`font-semibold font-mono ${p.punchOut ? 'text-slate-800' : 'text-emerald-600 font-bold animate-pulse'}`}>
                                {durationStr}
                              </span>
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
          SUB-TAB 5: EXECUTIVE REPORTS & AI DESK
          ------------------------------------------------------------- */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-display">Executive Reports and AI Engine</h2>
              <p className="text-xs text-slate-500">Compile weekly summaries, export CSV files, or call Gemini AI for team optimization</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Printer PDF Summary
              </button>
              <button
                onClick={() => exportCSV('leaderboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Excel Scorecard
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Col: Metric table list */}
            <div className="md:col-span-7 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 font-display">Calculated Performance Leaderboard ({selectedMonth})</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">
                      <th className="px-3 py-3 text-left">Team Member</th>
                      <th className="px-3 py-3">Completed Slides</th>
                      <th className="px-3 py-3">Words Produced</th>
                      <th className="px-3 py-3">Quality Score</th>
                      <th className="px-3 py-3">Attendance</th>
                      <th className="px-3 py-3 text-right">Engine Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((r, i) => (
                      <tr key={r.userId} className="border-b border-slate-50 hover:bg-slate-50/50 text-center">
                        <td className="px-3 py-3 text-left font-bold text-slate-700">
                          <span className="inline-flex w-4 text-slate-400 font-mono text-[10px]">{i+1}.</span>
                          {r.name}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{r.slidesCompleted} slides</td>
                        <td className="px-3 py-3 text-slate-600 font-mono">{r.wordsProduced} words</td>
                        <td className="px-3 py-3 text-emerald-700 font-bold">{r.avgQualityScore}%</td>
                        <td className="px-3 py-3 text-slate-500 font-mono">{r.attendancePercentage}%</td>
                        <td className="px-3 py-3 text-right font-extrabold text-emerald-600 font-mono">{r.performanceScore} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-55 p-4 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-normal">
                <p className="font-bold text-slate-700 mb-1">📐 Performance Formula Formula Check:</p>
                <code className="block bg-white text-slate-700 p-2 rounded border border-slate-100 font-mono text-center">
                  Score = (Slides × 10) + (Words × 0.1) + (Avg Quality × 20) + (Attendance % × 5)
                </code>
              </div>
            </div>

            {/* Right Col: Gemini report summaries */}
            <div className="md:col-span-5 bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800 font-display">Hub AI Report compilation</h3>
                <p className="text-xs text-slate-500">Select any target report variable to summon raw summaries directly from our Gemini AI client:</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700">June Monthly Velocity Report</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mb-2">Evaluates completion counts, standard grades & slide reviewer friction</p>
                  <GeminiAISummarizer 
                    action="generate-monthly-report" 
                    payload={{ totalSlidesCompleted: completedSlidesYTD, totalWordsProduced, averageQuality: teamAverageQuality, averageAttendance: teamAttendanceAvg }} 
                    buttonLabel="Generate June Executive Report" 
                  />
                </div>

                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700">Team Resource Optimization</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mb-2">Examines attendance levels against slide completion to boost bandwidth</p>
                  <GeminiAISummarizer 
                    action="summarize-team-productivity" 
                    payload={{ teamAttendanceAvg, teamAverageQuality, activeProjectsCount }} 
                    buttonLabel="Summarize Team Productivity" 
                  />
                </div>
              </div>

            </div>

          </div>
        </div>
      )}


          {/* Custom Confirmation Modal */}
          {confirmModal.isOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col transform transition-transform duration-200 scale-100">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-red-650">
                    <span className="p-2 bg-red-50 rounded-full text-red-650">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 font-display">{confirmModal.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{confirmModal.message}</p>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal({ ...confirmModal, isOpen: false });
                    }}
                    className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Confirm & Proceed
                  </button>
                </div>
              </div>
            </div>
          )}

    </div>
  );
};

import { User, Project, Slide, Attendance, PerformanceRecord, Notification, ActivityLog, AttendanceCode, PunchRecord } from '../types';

// Pre-seeded Users
const DEFAULT_USERS: User[] = [
  {
    id: 'EMP000',
    name: 'Hebin Raj (Admin)',
    email: 'hebinraj.learninggems@gmail.com',
    role: 'admin',
    joiningDate: '2024-01-01',
    status: 'active',
    password: 'hebinrajadmin@224488'
  },
  {
    id: 'EMP001',
    name: 'Akhil R Krishnan',
    email: 'akhilkrishnan.learninggems@gmail.com',
    role: 'employee',
    joiningDate: '2025-01-15',
    status: 'active',
    password: 'akhil@123'
  },
  {
    id: 'EMP002',
    name: 'Aswin Simon',
    email: 'aswin.learninggems@gmail.com',
    role: 'employee',
    joiningDate: '2025-02-10',
    status: 'active',
    password: 'aswin@123'
  },
  {
    id: 'EMP003',
    name: 'Hari Krishnan',
    email: 'harikrishnan.learninggems@gmail.com',
    role: 'employee',
    joiningDate: '2025-03-01',
    status: 'active',
    password: 'hari@123'
  },
  {
    id: 'EMP004',
    name: 'Lekshmi Das',
    email: 'lekshmidas.learninggems@gmail.com',
    role: 'employee',
    joiningDate: '2025-04-12',
    status: 'active',
    password: 'lekshmidas@123'
  },
  {
    id: 'EMP005',
    name: 'Vishnudas S K',
    email: 'vishnudas.learninggems@gmail.com',
    role: 'employee',
    joiningDate: '2025-05-18',
    status: 'active',
    password: 'vishnudas@123'
  }
];

// Pre-seeded Projects
const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'PRJ001',
    projectName: 'Interactive Compliance Training 2026',
    clientName: 'Global FinTech Ltd',
    version: 'v1.2',
    projectType: 'Compliance Training',
    startDate: '2026-06-01',
    dueDate: '2026-06-25',
    priority: 'high',
    status: 'In Progress'
  },
  {
    id: 'PRJ002',
    projectName: 'SaaS Platform Launch Promo',
    clientName: 'CloudSparks Inc',
    version: 'v4.0',
    projectType: 'Promo Video',
    startDate: '2026-05-15',
    dueDate: '2026-06-18', // Overdue based on June 19, 2026
    priority: 'medium',
    status: 'In Progress'
  },
  {
    id: 'PRJ003',
    projectName: 'Hospitality Onboarding Masterclass',
    clientName: 'Emerald Resorts',
    version: 'v1.0',
    projectType: 'Hospitality Training',
    startDate: '2026-05-01',
    dueDate: '2026-05-30',
    priority: 'low',
    status: 'Completed'
  },
  {
    id: 'PRJ004',
    projectName: 'Storyline Interactive AI Course',
    clientName: 'Modern Learning Systems',
    version: 'v2.1',
    projectType: 'AI Course',
    startDate: '2026-06-10',
    dueDate: '2026-07-15',
    priority: 'high',
    status: 'In Progress'
  }
];

// Pre-seeded Slides
const DEFAULT_SLIDES: Slide[] = [
  // PRJ001 Slides (Compliance Training)
  {
    id: 'SLD101',
    projectId: 'PRJ001',
    slideName: 'Intro & FinTech Landscape',
    assignedEmployeeId: 'EMP001',
    wordsCount: 150,
    status: 'Completed',
    qualityScore: 95,
    outputLink: 'https://docs.google.com/presentation/d/gems-compliance-slide1',
    startDate: '2026-06-02',
    endDate: '2026-06-05',
    duration: 3
  },
  {
    id: 'SLD102',
    projectId: 'PRJ001',
    slideName: 'Anti-Money Laundering Regulations',
    assignedEmployeeId: 'EMP002',
    wordsCount: 320,
    status: 'Client Review',
    qualityScore: 0, // Not graded yet
    outputLink: 'https://docs.google.com/presentation/d/gems-compliance-slide2',
    startDate: '2026-06-06',
    endDate: '2026-06-12',
    duration: 6
  },
  {
    id: 'SLD103',
    projectId: 'PRJ001',
    slideName: 'Cybersecurity Threat Mitigation',
    assignedEmployeeId: 'EMP003',
    wordsCount: 210,
    status: 'In Progress',
    qualityScore: 0,
    outputLink: '',
    startDate: '2026-06-13',
    endDate: '',
    duration: 0
  },
  {
    id: 'SLD104',
    projectId: 'PRJ001',
    slideName: 'Regulatory Audits & Exercises',
    assignedEmployeeId: 'EMP004',
    wordsCount: 180,
    status: 'Not Started',
    qualityScore: 0,
    outputLink: '',
    startDate: '2026-06-18',
    endDate: '',
    duration: 0
  },

  // PRJ002 Slides (Promo Video)
  {
    id: 'SLD201',
    projectId: 'PRJ002',
    slideName: 'Promo Video Script Scene 1 & 2',
    assignedEmployeeId: 'EMP004',
    wordsCount: 190,
    status: 'Completed',
    qualityScore: 92,
    outputLink: 'https://drive.google.com/file/d/gems-promo-scene1',
    startDate: '2026-05-18',
    endDate: '2026-05-22',
    duration: 4
  },
  {
    id: 'SLD202',
    projectId: 'PRJ002',
    slideName: 'Promo Motion Graphics Scene 3',
    assignedEmployeeId: 'EMP005',
    wordsCount: 85,
    status: 'Internal Review',
    qualityScore: 0,
    outputLink: 'https://drive.google.com/file/d/gems-promo-scene3',
    startDate: '2026-05-25',
    endDate: '2026-06-05',
    duration: 11
  },
  {
    id: 'SLD203',
    projectId: 'PRJ002',
    slideName: 'Sound FX & Final Rendering',
    assignedEmployeeId: 'EMP005',
    wordsCount: 50,
    status: 'In Progress',
    qualityScore: 0,
    outputLink: '',
    startDate: '2026-06-06',
    endDate: '',
    duration: 0
  },

  // PRJ003 Slides (Hospitality Training)
  {
    id: 'SLD301',
    projectId: 'PRJ003',
    slideName: 'Welcome Guide & Guest Values',
    assignedEmployeeId: 'EMP001',
    wordsCount: 220,
    status: 'Completed',
    qualityScore: 96,
    outputLink: 'https://docs.google.com/presentation/d/gems-hospitality-s1',
    startDate: '2026-05-02',
    endDate: '2026-05-05',
    duration: 3
  },
  {
    id: 'SLD302',
    projectId: 'PRJ003',
    slideName: 'Dining Room Table Etiquette',
    assignedEmployeeId: 'EMP004',
    wordsCount: 280,
    status: 'Completed',
    qualityScore: 94,
    outputLink: 'https://docs.google.com/presentation/d/gems-hospitality-s2',
    startDate: '2026-05-06',
    endDate: '2026-05-12',
    duration: 6
  },
  {
    id: 'SLD303',
    projectId: 'PRJ003',
    slideName: 'Confrontation Resolution Scenarios',
    assignedEmployeeId: 'EMP005',
    wordsCount: 300,
    status: 'Completed',
    qualityScore: 90,
    outputLink: 'https://docs.google.com/presentation/d/gems-hospitality-s3',
    startDate: '2026-05-13',
    endDate: '2026-05-20',
    duration: 7
  },

  // PRJ004 Slides (AI Course)
  {
    id: 'SLD401',
    projectId: 'PRJ004',
    slideName: 'Introduction to Prompt Engineering',
    assignedEmployeeId: 'EMP002',
    wordsCount: 400,
    status: 'Completed',
    qualityScore: 98,
    outputLink: 'https://docs.google.com/presentation/d/gems-aicourse-s1',
    startDate: '2026-06-11',
    endDate: '2026-06-15',
    duration: 4
  },
  {
    id: 'SLD402',
    projectId: 'PRJ004',
    slideName: 'Harnessing LLM Agents in Workflows',
    assignedEmployeeId: 'EMP003',
    wordsCount: 310,
    status: 'In Progress',
    qualityScore: 0,
    outputLink: '',
    startDate: '2026-06-16',
    endDate: '',
    duration: 0
  }
];

// Pre-seeded Attendance
// Generate attendance entries for each employee for weekdays of June 1 to June 19, 2026.
const generatePreseededAttendance = (): Attendance[] => {
  const attendance: Attendance[] = [];
  const employees = ['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005'];
  const startDay = 1;
  const endDay = 19; // June 19, 2026 (today)

  for (let day = startDay; day <= endDay; day++) {
    const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
    const dayOfWeek = new Date(2026, 5, day).getDay(); // June is month index 5

    employees.forEach(empId => {
      let code: AttendanceCode = 'P';

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        code = 'H'; // Holiday on weekend
      } else {
        // Add random variation to leaves
        if (empId === 'EMP001' && day === 16) code = 'CL'; // Akhil casual leave
        else if (empId === 'EMP002' && day === 3) code = 'SL'; // Aswin sick leave
        else if (empId === 'EMP003' && day === 17) code = 'HD'; // Hari half day
        else if (empId === 'EMP004' && day === 10) code = 'CL'; // Lekshmi casual leave
        else if (empId === 'EMP005' && day === 5) code = 'SL'; // Vishnudas sick leave
      }

      attendance.push({
        id: `ATT-${empId}-${day}`,
        userId: empId,
        date: dateStr,
        code
      });
    });
  }

  // Prepopulate May weekends as holiday and weekdays as 'P' to provide clean historical data
  for (let day = 1; day <= 31; day++) {
    const dateStr = `2026-05-${day.toString().padStart(2, '0')}`;
    const dayOfWeek = new Date(2026, 4, day).getDay();

    employees.forEach(empId => {
      const code: AttendanceCode = (dayOfWeek === 0 || dayOfWeek === 6) ? 'H' : 'P';
      attendance.push({
        id: `ATT-MAY-${empId}-${day}`,
        userId: empId,
        date: dateStr,
        code
      });
    });
  }

  return attendance;
};

// Seed Notifications
const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'NTF001',
    type: 'due_soon',
    title: 'Project Due Soon',
    message: 'Interactive Compliance Training 2026 is due in 6 days (June 25). Please verify outstanding slides!',
    date: '2026-06-19T08:00:00.000Z',
    read: false
  },
  {
    id: 'NTF002',
    type: 'overdue',
    title: 'Overdue Project Alert',
    message: 'SaaS Platform Launch Promo was due on June 18 and is currently unfinished.',
    date: '2026-06-19T08:30:00.000Z',
    read: false
  },
  {
    id: 'NTF003',
    type: 'winner',
    title: 'Performer of the Month',
    message: 'Akhil R Krishnan is calculated as the Performer of the Month for May with a score of 874.5!',
    date: '2026-06-01T09:00:00.000Z',
    read: true
  }
];

// Activity Logs
const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: 'LOG001',
    userId: 'EMP001',
    userName: 'Akhil R Krishnan',
    action: 'Updated slide Intro & FinTech Landscape status to "Completed"',
    timestamp: '2026-06-18T14:22:00.000Z'
  },
  {
    id: 'LOG002',
    userId: 'EMP000',
    userName: 'Admin Manager',
    action: 'Created project "Storyline Interactive AI Course"',
    timestamp: '2026-06-10T09:15:30.000Z'
  },
  {
    id: 'LOG003',
    userId: 'EMP002',
    userName: 'Aswin Simon',
    action: 'Marked slide Intro to Prompt Engineering as "Completed"',
    timestamp: '2026-06-15T16:45:00.000Z'
  }
];

// Helpers for localStorage sync
const getStored = <T>(key: string, defaultVal: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const setStored = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error saving localStorage key: ${key}`, e);
  }
};

// Main state store class
class StoreManager {
  private users: User[];
  private projects: Project[];
  private slides: Slide[];
  private attendance: Attendance[];
  private notifications: Notification[];
  private logs: ActivityLog[];
  private punches: PunchRecord[];
  private listeners: (() => void)[] = [];

  constructor() {
    this.users = getStored('lg_users', DEFAULT_USERS);
    // Migration: ensure active user list is updated with Hebin Raj and employee custom passwords
    const hasCorrectAdmin = this.users.some(u => u.email === 'hebinraj.learninggems@gmail.com');
    if (!hasCorrectAdmin) {
      this.users = DEFAULT_USERS;
      setStored('lg_users', DEFAULT_USERS);
    }
    this.projects = getStored('lg_projects', DEFAULT_PROJECTS);
    this.slides = getStored('lg_slides', DEFAULT_SLIDES);
    this.attendance = getStored('lg_attendance', []);
    if (this.attendance.length === 0) {
      this.attendance = generatePreseededAttendance();
      setStored('lg_attendance', this.attendance);
    }
    this.notifications = getStored('lg_notifications', DEFAULT_NOTIFICATIONS);
    this.logs = getStored('lg_logs', DEFAULT_LOGS);
    this.punches = getStored('lg_punches', []);
  }

  // Retrieve full state snapshot
  getState() {
    return {
      users: this.users,
      projects: this.projects,
      slides: this.slides,
      attendance: this.attendance,
      notifications: this.notifications,
      logs: this.logs,
      punches: this.punches
    };
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // Activity Logger
  log(userId: string, userName: string, action: string) {
    const logEntry: ActivityLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      userName,
      action,
      timestamp: new Date().toISOString()
    };
    this.logs = [logEntry, ...this.logs].slice(0, 100); // Max 100 logs
    setStored('lg_logs', this.logs);
    this.notify();
  }

  // Getters
  getUsers(): User[] { return this.users; }
  getProjects(): Project[] { return this.projects; }
  getSlides(): Slide[] { return this.slides; }
  getAttendance(): Attendance[] { return this.attendance; }
  getNotifications(): Notification[] { return this.notifications; }
  getLogs(): ActivityLog[] { return this.logs; }
  getPunches(): PunchRecord[] { return this.punches; }

  // Punch actions
  punchIn(userId: string, userName: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = this.punches.find(p => p.userId === userId && p.status === 'active');
    if (existing) return existing;

    const newPunch: PunchRecord = {
      id: `PUNCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      userName,
      date: todayStr,
      punchIn: new Date().toISOString(),
      status: 'active'
    };
    
    this.punches = [newPunch, ...this.punches];
    setStored('lg_punches', this.punches);
    this.log(userId, userName, `Punched IN timing recorded`);
    this.notify();
    return newPunch;
  }

  punchOut(userId: string, userName: string) {
    const activeIdx = this.punches.findIndex(p => p.userId === userId && p.status === 'active');
    if (activeIdx === -1) return null;

    const updatedPunch = {
      ...this.punches[activeIdx],
      punchOut: new Date().toISOString(),
      status: 'completed' as const
    };

    const newPunches = [...this.punches];
    newPunches[activeIdx] = updatedPunch;
    this.punches = newPunches;

    setStored('lg_punches', this.punches);
    this.log(userId, userName, `Punched OUT timing recorded`);
    this.notify();
    return updatedPunch;
  }

  // User Actions
  addUser(user: Omit<User, 'id'>) {
    const id = `EMP${(this.users.length + 1).toString().padStart(3, '0')}`;
    const newUser: User = { ...user, id };
    this.users.push(newUser);
    setStored('lg_users', this.users);
    this.log('EMP000', 'Admin', `Added new employee ${user.name}`);
    this.notify();
    return newUser;
  }

  updateUser(id: string, updated: Partial<User>) {
    this.users = this.users.map(u => u.id === id ? { ...u, ...updated } : u);
    setStored('lg_users', this.users);
    this.log('EMP000', 'Admin', `Updated employee profile of ${this.users.find(u => u.id === id)?.name}`);
    this.notify();
  }

  deactivateUser(id: string) {
    this.users = this.users.map(u => u.id === id ? { ...u, status: 'deactivated' as const } : u);
    setStored('lg_users', this.users);
    this.log('EMP000', 'Admin', `Deactivated employee ID ${id}`);
    this.notify();
  }

  // Project Actions
  addProject(project: Omit<Project, 'id'>) {
    const id = `PRJ${(this.projects.length + 1).toString().padStart(3, '0')}`;
    const newProject: Project = { ...project, id };
    this.projects.push(newProject);
    setStored('lg_projects', this.projects);
    this.log('EMP000', 'Admin', `Created project "${project.projectName}"`);
    
    // Add simple notification for assignment
    this.addNotification({
      type: 'new_assignment',
      title: 'New Project Created',
      message: `Project ${project.projectName} (${project.projectType}) has been registered.`,
      read: false
    });

    this.notify();
    return newProject;
  }

  updateProject(id: string, updated: Partial<Project>) {
    this.projects = this.projects.map(p => p.id === id ? { ...p, ...updated } : p);
    setStored('lg_projects', this.projects);
    const projName = this.projects.find(p => p.id === id)?.projectName;
    this.log('EMP000', 'Admin', `Updated status of project "${projName}"`);
    this.notify();
  }

  deleteProject(id: string) {
    const projName = this.projects.find(p => p.id === id)?.projectName;
    this.projects = this.projects.filter(p => p.id !== id);
    // Delete slides tied to this project
    this.slides = this.slides.filter(s => s.projectId !== id);
    setStored('lg_projects', this.projects);
    setStored('lg_slides', this.slides);
    this.log('EMP000', 'Admin', `Deleted project "${projName}" and all associated slides`);
    this.notify();
  }

  // Slide Actions
  addSlide(slide: Omit<Slide, 'id'>) {
    const id = `SLD${Date.now()}`;
    const newSlide: Slide = { ...slide, id };
    this.slides.push(newSlide);
    setStored('lg_slides', this.slides);
    const emp = this.users.find(u => u.id === slide.assignedEmployeeId)?.name;
    const proj = this.projects.find(p => p.id === slide.projectId)?.projectName;
    this.log('EMP000', 'Admin', `Assigned slide "${slide.slideName}" to ${emp} on project "${proj}"`);

    // Create assignment notification
    this.addNotification({
      type: 'new_assignment',
      title: 'New Slide Layout Assigned',
      message: `You have been assigned the slide "${slide.slideName}" under ${proj}.`,
      read: false,
      userId: slide.assignedEmployeeId
    });

    this.notify();
    return newSlide;
  }

  updateSlide(id: string, updated: Partial<Slide>, actorId: string, actorName: string) {
    this.slides = this.slides.map(s => {
      if (s.id === id) {
        // Calculate duration if completed
        let duration = s.duration;
        let endDate = s.endDate;
        if (updated.status === 'Completed' && s.status !== 'Completed') {
          endDate = new Date().toISOString().split('T')[0];
          const start = new Date(s.startDate);
          const end = new Date(endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        }
        return {
          ...s,
          ...updated,
          endDate,
          duration
        };
      }
      return s;
    });

    setStored('lg_slides', this.slides);
    const sl = this.slides.find(s => s.id === id);
    this.log(actorId, actorName, `Updated slide "${sl?.slideName}" to ${updated.status || 'new parameters'}`);
    this.notify();
  }

  deleteSlide(id: string) {
    const slideName = this.slides.find(s => s.id === id)?.slideName;
    this.slides = this.slides.filter(s => s.id !== id);
    setStored('lg_slides', this.slides);
    this.log('EMP000', 'Admin', `Deleted slide "${slideName}"`);
    this.notify();
  }

  // Attendance Actions
  logAttendance(userId: string, date: string, code: AttendanceCode, actorName: string) {
    const foundIdx = this.attendance.findIndex(a => a.userId === userId && a.date === date);
    if (foundIdx > -1) {
      this.attendance[foundIdx].code = code;
    } else {
      this.attendance.push({
        id: `ATT-${userId}-${date}-${Math.floor(Math.random() * 1000)}`,
        userId,
        date,
        code
      });
    }
    setStored('lg_attendance', this.attendance);
    const empName = this.users.find(u => u.id === userId)?.name;
    this.log('EMP000', actorName, `Logged attendance for ${empName} on ${date} as [${code}]`);

    // Add alert if marked left
    if (code === 'CL' || code === 'SL') {
      this.addNotification({
        type: 'attendance_alert',
        title: 'Leave Logged',
        message: `${empName} has been marked on ${code === 'CL' ? 'Casual' : 'Sick'} Leave for ${date}.`,
        read: false
      });
    }

    this.notify();
  }

  // Notifications Utility
  addNotification(notification: Omit<Notification, 'id' | 'date'>) {
    const id = `NTF-${Date.now()}`;
    const newN: Notification = {
      ...notification,
      id,
      date: new Date().toISOString()
    };
    this.notifications = [newN, ...this.notifications].slice(0, 50); // limit 50
    setStored('lg_notifications', this.notifications);
    this.notify();
  }

  clearNotifications() {
    this.notifications = [];
    setStored('lg_notifications', []);
    this.notify();
  }

  markNotificationAsRead(id: string) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setStored('lg_notifications', this.notifications);
    this.notify();
  }

  // Clear or Restore defaults (Auto backup / reset helper)
  resetToDefaults() {
    this.users = DEFAULT_USERS;
    this.projects = DEFAULT_PROJECTS;
    this.slides = DEFAULT_SLIDES;
    this.attendance = generatePreseededAttendance();
    this.notifications = DEFAULT_NOTIFICATIONS;
    this.logs = [
      {
        id: `LOG-${Date.now()}`,
        userId: 'EMP000',
        userName: 'System',
        action: 'Database restored to initial pristine backups',
        timestamp: new Date().toISOString()
      },
      ...DEFAULT_LOGS
    ];
    setStored('lg_users', this.users);
    setStored('lg_projects', this.projects);
    setStored('lg_slides', this.slides);
    setStored('lg_attendance', this.attendance);
    setStored('lg_notifications', this.notifications);
    setStored('lg_logs', this.logs);
    this.notify();
  }

  // CORE PERFORMANCE ENGINE calculations
  calculateLeaderboard(monthStr: string = '2026-06'): PerformanceRecord[] {
    const employees = this.users.filter(u => u.role === 'employee' && u.status === 'active');
    
    const records: PerformanceRecord[] = employees.map(emp => {
      // 1. Slides Completed
      // Filter slides completed in the filtered month (or simply overall if empty, let's filter completed slides assigned to this worker)
      const empSlides = this.slides.filter(s => s.assignedEmployeeId === emp.id);
      const completedSlides = empSlides.filter(s => s.status === 'Completed');
      const numSlidesCompleted = completedSlides.length;

      // 2. Words Produced
      const totalWordsProduced = completedSlides.reduce((acc, curr) => acc + curr.wordsCount, 0);

      // 3. Quality Score
      const scoresWithGrade = completedSlides.filter(s => s.qualityScore > 0);
      const avgQualityScore = scoresWithGrade.length > 0
        ? Math.round(scoresWithGrade.reduce((acc, curr) => acc + curr.qualityScore, 0) / scoresWithGrade.length)
        : 85; // default benchmark if not graded fully yet

      // 4. Attendance Percentage
      // Find all days logged in that specific month (e.g. "2026-06")
      const empAttendance = this.attendance.filter(a => a.userId === emp.id && a.date.startsWith(monthStr));
      const totalWorkingDaysInLog = empAttendance.length;
      
      let attendancePercentage = 100;
      if (totalWorkingDaysInLog > 0) {
        const presents = empAttendance.filter(a => a.code === 'P').length;
        const holidays = empAttendance.filter(a => a.code === 'H').length;
        const halfDays = empAttendance.filter(a => a.code === 'HD').length;
        // Total presents + holidays + halfDays * 0.5
        const attendedValue = presents + holidays + (halfDays * 0.5);
        attendancePercentage = Math.round((attendedValue / totalWorkingDaysInLog) * 100);
      } else {
        // Fallback to average month if no records found for filtered month
        const overallAttendance = this.attendance.filter(a => a.userId === emp.id);
        if (overallAttendance.length > 0) {
          const presents = overallAttendance.filter(a => a.code === 'P').length;
          const holidays = overallAttendance.filter(a => a.code === 'H').length;
          const halfDays = overallAttendance.filter(a => a.code === 'HD').length;
          attendancePercentage = Math.round(((presents + holidays + halfDays * 0.5) / overallAttendance.length) * 100);
        }
      }

      // 5. Projects Delivered
      // A project is delivered/delivered-by-employee if all slides the employee is assigned to on that project are Completed,
      // and project status is Completed.
      const assignedProjIds = Array.from(new Set(empSlides.map(s => s.projectId)));
      const completedProjectsCount = assignedProjIds.filter(projId => {
        const proj = this.projects.find(p => p.id === projId);
        if (!proj || proj.status !== 'Completed') return false;
        // All slides assigned to employee in this project must be done
        const empProjSlides = empSlides.filter(s => s.projectId === projId);
        return empProjSlides.every(s => s.status === 'Completed');
      }).length;

      // FORMULA:
      // Slides Completed * 10
      // + Words Count * 0.1
      // + Quality Score * 20
      // + Attendance Percentage * 5
      const rawScore = (numSlidesCompleted * 10) +
                       (totalWordsProduced * 0.1) +
                       (avgQualityScore * 20) +
                       (attendancePercentage * 5);

      const performanceScore = parseFloat(rawScore.toFixed(2));

      return {
        userId: emp.id,
        name: emp.name,
        slidesCompleted: numSlidesCompleted,
        wordsProduced: totalWordsProduced,
        avgQualityScore,
        attendancePercentage,
        projectsDelivered: completedProjectsCount,
        performanceScore
      };
    });

    // Rank from highest score to lowest
    const rankedRecords = records.sort((a, b) => b.performanceScore - a.performanceScore);
    return rankedRecords.map((rec, index) => ({
      ...rec,
      rank: index + 1
    }));
  }

  // Return dynamic Performer of the Month
  getPerformerOfTheMonth(monthStr: string = '2026-06'): {
    winner: User;
    score: number;
    slides: number;
    words: number;
    quality: number;
    attendance: number;
    reason: string;
  } {
    const leaderboard = this.calculateLeaderboard(monthStr);
    const topRecord = leaderboard[0];

    // Default return if no active leaderboard
    if (!topRecord) {
      return {
        winner: DEFAULT_USERS[1], // Akhil R Krishnan
        score: 955.0,
        slides: 3,
        words: 770,
        quality: 96,
        attendance: 100,
        reason: "Highest productivity and slide clearance with pristine words accuracy."
      };
    }

    const winnerUser = this.users.find(u => u.id === topRecord.userId) || DEFAULT_USERS[1];

    // Dynamic reason generation
    let reason = `Outstanding performance with ${topRecord.slidesCompleted} complete slides and ${topRecord.wordsProduced} total words.`;
    if (topRecord.avgQualityScore >= 95) {
      reason += ` Maintained a brilliant average slide quality score of ${topRecord.avgQualityScore}%.`;
    }
    if (topRecord.attendancePercentage >= 95) {
      reason += ` Exemplary dedication with a ${topRecord.attendancePercentage}% attendance log.`;
    }

    return {
      winner: winnerUser,
      score: topRecord.performanceScore,
      slides: topRecord.slidesCompleted,
      words: topRecord.wordsProduced,
      quality: topRecord.avgQualityScore,
      attendance: topRecord.attendancePercentage,
      reason
    };
  }
}

export const store = new StoreManager();

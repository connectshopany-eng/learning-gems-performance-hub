/**
 * Type definitions for Learning Gems Performance Hub
 */

export type UserRole = 'admin' | 'employee';
export type UserStatus = 'active' | 'deactivated';

export interface User {
  id: string; // Employee ID
  name: string;
  email: string;
  role: UserRole;
  joiningDate: string;
  status: UserStatus;
  password?: string; // Stored for login simulation/sync
}

export type ProjectType =
  | 'Storyline Course'
  | 'Rise Course'
  | 'Motion Graphics'
  | 'Compliance Training'
  | 'Hospitality Training'
  | 'Promo Video'
  | 'Animation'
  | 'AI Course';

export type ProjectPriority = 'low' | 'medium' | 'high';
export type ProjectStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';

export interface Project {
  id: string;
  projectName: string;
  clientName: string;
  version: string;
  projectType: ProjectType;
  startDate: string;
  dueDate: string;
  priority: ProjectPriority;
  status: ProjectStatus;
}

export type SlideStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Internal Review'
  | 'Client Review'
  | 'Completed'
  | 'Good to Go';

export interface Slide {
  id: string;
  projectId: string;
  slideName: string;
  assignedEmployeeId: string; // User ID
  wordsCount: number;
  status: SlideStatus;
  qualityScore: number; // 0 to 105
  outputLink: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  createdByUserId?: string;
  createdByUserName?: string;
  isCombined?: boolean;
  combinedByUserId?: string;
  combinedByUserName?: string;
  combinedAt?: string;
}

export type AttendanceCode = 'P' | 'CL' | 'SL' | 'HD' | 'H';

export interface Attendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  code: AttendanceCode;
}

export interface PerformanceRecord {
  userId: string;
  name: string;
  slidesCompleted: number;
  wordsProduced: number;
  avgQualityScore: number;
  attendancePercentage: number;
  projectsDelivered: number;
  performanceScore: number;
  rank?: number;
}

export interface Notification {
  id: string;
  type: 'due_soon' | 'overdue' | 'new_assignment' | 'attendance_alert' | 'winner';
  title: string;
  message: string;
  date: string;
  read: boolean;
  userId?: string; // optional user specificity, or global
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface PunchRecord {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  punchIn: string; // ISO timestamp
  punchOut?: string; // ISO timestamp
  status: 'active' | 'completed';
}


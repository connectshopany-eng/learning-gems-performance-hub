import React, { useState } from 'react';
import { Project, Slide, PerformanceRecord } from '../types';

interface ChartsProps {
  projects: Project[];
  slides: Slide[];
  leaderboard: PerformanceRecord[];
}

export const DashboardCharts: React.FC<ChartsProps> = ({ projects, slides, leaderboard }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // 1. Calculate Project Status Counts
  const activeCount = projects.filter(p => p.status === 'In Progress').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const holdCount = projects.filter(p => p.status === 'On Hold').length;
  const notStartedCount = projects.filter(p => p.status === 'Not Started').length;
  const totalCount = projects.length || 1;

  // Pie chart calculation helper
  const statuses = [
    { label: 'In Progress', count: activeCount, color: '#16a34a' },
    { label: 'Completed', count: completedCount, color: '#22c55e' },
    { label: 'On Hold', count: holdCount, color: '#f59e0b' },
    { label: 'Not Started', count: notStartedCount, color: '#94a3b8' }
  ].filter(s => s.count > 0);

  // 2. Bar Chart calculation for Leaderboard Performance
  const maxScore = Math.max(...leaderboard.map(l => l.performanceScore), 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Project Lifecycle Distribution */}
      <div id="chart-project-status" className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white font-display">Project Status Allocation</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-sans">Functional breakdown of YTD corporate projects</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-4">
          {/* Radial SVG Donut */}
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {statuses.length === 0 ? (
                <circle cx="50" cy="50" r="35" fill="transparent" stroke="#e2e8f0" strokeWidth="18" />
              ) : (
                (() => {
                  let accumulatedPercent = 0;
                  return statuses.map((status, idx) => {
                    const percent = (status.count / totalCount) * 100;
                    const r = 35;
                    const circ = 2 * Math.PI * r; // ~219.9
                    const strokeLength = (percent / 100) * circ;
                    const strokeOffset = circ - (accumulatedPercent / 100) * circ;
                    accumulatedPercent += percent;

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r={r}
                        fill="transparent"
                        stroke={status.color}
                        strokeWidth="16"
                        strokeDasharray={`${strokeLength} ${circ}`}
                        strokeDashoffset={strokeOffset}
                        className="transition-all duration-300 hover:stroke-[18px] cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      />
                    );
                  });
                })()
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800 dark:text-white font-display">{projects.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Projects</span>
            </div>
          </div>

          {/* Legend Table */}
          <div className="space-y-2 w-full sm:w-auto">
            {statuses.map((status, idx) => {
              const percent = Math.round((status.count / totalCount) * 100);
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-2 py-1 rounded transition-colors ${
                    hoveredIdx === idx ? 'bg-slate-50 dark:bg-slate-800' : ''
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                  <div className="flex justify-between gap-8 text-xs w-full">
                    <span className="text-slate-600 dark:text-slate-350 font-medium">{status.label}</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{status.count} ({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart 2: Employee Performance Index Bars */}
      <div id="chart-employee-performance" className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white font-display mb-1">Company Performance Leaderboard</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-sans">Real-time aggregate performance score calculated via corporate formula</p>

        <div className="space-y-4">
          {leaderboard.slice(0, 5).map((record, index) => {
            const widthPct = (record.performanceScore / maxScore) * 100;
            return (
              <div key={record.userId} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      index === 0 ? 'bg-yellow-105 text-yellow-850 dark:bg-yellow-900/30 dark:text-yellow-405' :
                      index === 1 ? 'bg-slate-105 text-slate-750 dark:bg-slate-800/60 dark:text-slate-300' :
                      index === 2 ? 'bg-orange-105 text-orange-850 dark:bg-orange-900/30 dark:text-orange-405' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                    {record.name}
                  </span>
                  <span className="font-bold text-[#16A34A] dark:text-emerald-400 font-mono">{record.performanceScore} pts</span>
                </div>
                
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full relative">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className="h-full bg-gradient-to-r from-[#16A34A] to-[#15803D] rounded-full transition-all duration-500"
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 text-right pr-1">
                  <span>{record.slidesCompleted} Slides Done</span>
                  <span>{record.wordsProduced} Words Written</span>
                  <span>{record.avgQualityScore}% Quality</span>
                </div>
              </div>
            );
          })}
          {leaderboard.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs dark:text-slate-500">No active employee performance stats available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { DashboardPage } from './DashboardPage';
import { MonthlyReportPage } from './MonthlyReportPage';
import { DuReportPage } from './DuReportPage';
import { ProjectReportPage } from './ProjectReportPage';
import { EndingsReportPage } from './EndingsReportPage';
import { ToolPrivateReportPage } from './ToolPrivateReportPage';
import { ProjectPrivateReportPage } from './ProjectPrivateReportPage';   // ← NEW

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'monthly',   label: 'Monthly' },
  { key: 'du',        label: 'DU Report' },
  { key: 'project',   label: 'Project Report' },
  { key: 'endings',   label: 'Endings Report' },
  { key: 'tool',      label: 'Tool-Private' },
  { key: 'projpriv',  label: 'Project-Private' },   // ← NEW
];

export const ReportsPage = () => {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="reports-page">
      <div className="report-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`report-tab ${tab === t.key ? 'report-tab-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="report-content">
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'monthly'   && <MonthlyReportPage />}
        {tab === 'du'        && <DuReportPage />}
        {tab === 'project'   && <ProjectReportPage />}
        {tab === 'endings'   && <EndingsReportPage />}
        {tab === 'tool'      && <ToolPrivateReportPage />}
        {tab === 'projpriv'  && <ProjectPrivateReportPage />}   {/* ← NEW */}
      </div>
    </div>
  );
};
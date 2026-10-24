import { DashboardPage } from './DashboardPage';
import { MonthlyReportPage } from './MonthlyReportPage';
import { DuReportPage } from './DuReportPage';
import { ProjectReportPage } from './ProjectReportPage';
import { EndingsReportPage } from './EndingsReportPage';
import { ToolPrivateReportPage } from './ToolPrivateReportPage';
import { ProjectPrivateReportPage } from './ProjectPrivateReportPage';
import {TeamMovementReportPage } from './TeamMovementReportPage'   // ← NEW
import { StandOutTeamsPage } from './StandOutTeamsPage';

export const ReportsPage = ({ tab }) => {
  return (
    <div className="reports-page">
      <div className="report-content">
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'monthly'   && <MonthlyReportPage />}
        {tab === 'du'        && <DuReportPage />}
        {tab === 'project'   && <ProjectReportPage />}
        {tab === 'endings'   && <EndingsReportPage />}
        {tab === 'tool'      && <ToolPrivateReportPage />}
        {tab === 'projpriv'  && <ProjectPrivateReportPage />}   {/* ← NEW */}
        {tab === 'teamMovement' && <TeamMovementReportPage />}
        {tab === 'standOutTeams' && <StandOutTeamsPage />}
      </div>
    </div>
  );
};
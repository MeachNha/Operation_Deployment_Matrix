import React, { useState, lazy, Suspense } from 'react';

import { Sidebar } from './views/components/Sidebar';

const ReportsPage = lazy(() =>
  import('./views/pages/ReportsPage').then((module) => ({
    default: module.ReportsPage,
  }))
);

const TeamsPage = lazy(() =>
  import('./views/pages/TeamsPage').then((module) => ({
    default: module.TeamsPage,
  }))
);

const DusPage = lazy(() =>
  import('./views/pages/DusPage').then((module) => ({
    default: module.DusPage,
  }))
);

const ProjectsPage = lazy(() =>
  import('./views/pages/ProjectsPage').then((module) => ({
    default: module.ProjectsPage,
  }))
);

const REPORT_PAGES = [
  'dashboard',
  'monthly',
  'du',
  'project',
  'endings',
  'tool',
  'projpriv',
  'teamMovement',
  'standOutTeams',
];

function App() {
  const [page, setPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'app-layout-sidebar-collapsed' : ''}`}>
      <Sidebar
        page={page}
        onPageChange={setPage}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />

      <main className="app-main">
        <Suspense fallback={<div>Loading...</div>}>
          {REPORT_PAGES.includes(page) && <ReportsPage tab={page} />}
          {page === 'teams' && <TeamsPage />}
          {page === 'dus' && <DusPage />}
          {page === 'projects' && <ProjectsPage />}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
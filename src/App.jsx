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

function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div className="app-layout">
      <Sidebar page={page} onPageChange={setPage} />

      <main className="app-main">
        <Suspense fallback={<div>Loading...</div>}>
          {page === 'dashboard' && <ReportsPage />}
          {page === 'teams' && <TeamsPage />}
          {page === 'dus' && <DusPage />}
          {page === 'projects' && <ProjectsPage />}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
import React from 'react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
];

const DATA_ITEMS = [
  { key: 'teams', label: 'Team', icon: '📄' },
  { key: 'dus', label: 'DU', icon: '🏢' },
  { key: 'projects', label: 'Project', icon: '📁' },
];

export const Sidebar = ({ page, onPageChange }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">ODM</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">Operation</div>
          <div className="sidebar-brand-title">Deployment Matrix</div>
        </div>
      </div>

      <nav className="sidebar-section">
        <div className="sidebar-section-title">Reports</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-item ${page === item.key ? 'sidebar-item-active' : ''}`}
            onClick={() => onPageChange(item.key)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <nav className="sidebar-section">
        <div className="sidebar-section-title">Data Management</div>
        {DATA_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-item ${page === item.key ? 'sidebar-item-active' : ''}`}
            onClick={() => onPageChange(item.key)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div>v1.0.0</div>
      </div>
    </aside>
  );
};
import React, { useState } from 'react';

const REPORT_ITEMS = [
  { key: 'monthly', label: 'Monthly', icon: '📅' },
  { key: 'du', label: 'DU Report', icon: '🏢' },
  { key: 'project', label: 'Project Report', icon: '📁' },
  { key: 'endings', label: 'Endings Report', icon: '📋' },
  { key: 'tool', label: 'Tool-Private', icon: '🔒' },
  { key: 'projpriv', label: 'Project-Private', icon: '🔐' },
  { key: 'teamMovement', label: 'Team Movement', icon: '🔄' },
  { key: 'standOutTeams', label: 'Stand Out Teams', icon: '⭐' },
];

const DATA_ITEMS = [
  { key: 'dashboard', label: 'Manage Deployments', icon: '📊' },
  { key: 'teams', label: 'Team', icon: '📄' },
  { key: 'dus', label: 'DU', icon: '🏢' },
  { key: 'projects', label: 'Project', icon: '📁' },
];

export const Sidebar = ({ page, onPageChange, collapsed, onToggleCollapsed }) => {
  const isDataEntryPage = DATA_ITEMS.some((item) => item.key === page);
  const [expandedGroup, setExpandedGroup] = useState(
    isDataEntryPage ? 'data-entry' : 'reports'
  );
  const isDataEntryExpanded = expandedGroup === 'data-entry';
  const isReportsExpanded = expandedGroup === 'reports';

  const toggleGroup = (group) => {
    setExpandedGroup((currentGroup) =>
      currentGroup === group ? null : group
    );
  };

  const selectPage = (key, group) => {
    setExpandedGroup(group);
    onPageChange(key);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">ODM</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">Operation</div>
          <div className="sidebar-brand-title">Deployment Matrix</div>
        </div>
        <button
          type="button"
          className="sidebar-collapse-button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d={collapsed ? 'm7 4 6 6-6 6' : 'm13 4-6 6 6 6'} />
          </svg>
        </button>
      </div>

      <nav className="sidebar-navigation" aria-label="Main navigation">
        <section className="sidebar-section">
          <button
            type="button"
              className={`sidebar-section-title ${isDataEntryExpanded ? 'sidebar-section-title-expanded' : ''} ${isDataEntryPage ? 'sidebar-section-title-current' : ''}`}
            aria-expanded={isDataEntryExpanded}
            aria-controls="data-entry-subnav"
            aria-label={collapsed ? 'Data Entry navigation group' : undefined}
            title={collapsed ? 'Data Entry' : undefined}
            onClick={() => toggleGroup('data-entry')}
          >
            <svg className="sidebar-section-icon" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3" y="3" width="5" height="5" rx="1" />
              <rect x="12" y="3" width="5" height="5" rx="1" />
              <rect x="3" y="12" width="5" height="5" rx="1" />
              <rect x="12" y="12" width="5" height="5" rx="1" />
            </svg>
            <span className="sidebar-section-label">Data Entry</span>
            <span className={`sidebar-chevron ${isDataEntryExpanded ? 'sidebar-chevron-open' : ''}`} aria-hidden="true" />
          </button>
          <div
            className="sidebar-subnav"
            id="data-entry-subnav"
            hidden={!isDataEntryExpanded}
          >
            {DATA_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sidebar-item ${page === item.key ? 'sidebar-item-active' : ''}`}
                aria-current={page === item.key ? 'page' : undefined}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                onClick={() => selectPage(item.key, 'data-entry')}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="sidebar-section">
          <button
            type="button"
            className={`sidebar-section-title ${isReportsExpanded ? 'sidebar-section-title-expanded' : ''} ${!isDataEntryPage ? 'sidebar-section-title-current' : ''}`}
            aria-expanded={isReportsExpanded}
            aria-controls="reports-subnav"
            aria-label={collapsed ? 'Reports navigation group' : undefined}
            title={collapsed ? 'Reports' : undefined}
            onClick={() => toggleGroup('reports')}
          >
            <svg className="sidebar-section-icon" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 3.5h7l3 3V16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
              <path d="M12 3.5V7h3M7 10h6M7 13h6" />
            </svg>
            <span className="sidebar-section-label">Reports</span>
            <span className={`sidebar-chevron ${isReportsExpanded ? 'sidebar-chevron-open' : ''}`} aria-hidden="true" />
          </button>
          <div
            className="sidebar-subnav"
            id="reports-subnav"
            hidden={!isReportsExpanded}
          >
            {REPORT_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sidebar-item ${page === item.key ? 'sidebar-item-active' : ''}`}
                aria-current={page === item.key ? 'page' : undefined}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                onClick={() => selectPage(item.key, 'reports')}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </nav>

      <div className="sidebar-footer">
        <div>v1.0.0</div>
      </div>
    </aside>
  );
};
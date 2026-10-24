import React from 'react';

const MATERIAL_TYPES = ['BCS', 'TSC', 'EOD', 'BAC', 'FMT', 'DUO', 'IDT'];

export const FilterBar = ({
  filters,
  updateFilter,
  resetFilters,
  dus = [],
  projects = [],
  teams = [],
}) => {
  const activeFilterCount = [
    filters.teamCode,
    filters.materialType,
    filters.province,
    filters.duCode,
    filters.projectCode,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  return (
    <section className="filter-bar deployment-filter-panel" aria-label="Filter deployments">
      <div className="deployment-filter-heading">
        <div>
          <span className="deployment-filter-eyebrow">REFINE RESULTS</span>
          <h2>Deployment filters</h2>
          <p>Combine categories to find the deployments you need.</p>
        </div>
        <div className="deployment-filter-actions">
          <span className="deployment-filter-count" aria-live="polite">
            {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
          </span>
          <button
            type="button"
            className="btn-reset deployment-filter-reset"
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="deployment-filter-categories">
        <section className="deployment-filter-category" aria-labelledby="team-filter-title">
          <div className="deployment-filter-category-heading">
            <span className="deployment-filter-category-icon" aria-hidden="true">◎</span>
            <div>
              <h3 id="team-filter-title">Team &amp; materials</h3>
              <p>Identify a team or its equipment</p>
            </div>
          </div>
          <div className="deployment-filter-fields">
            <div className="filter-group">
              <label>Team</label>
              <select
                value={filters.teamCode || ''}
                onChange={(e) => updateFilter('teamCode', e.target.value)}
              >
                <option value="">All Teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.team_code}>
                    {t.team_code}{t.mat ? ` (${t.mat})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Material</label>
              <select
                value={filters.materialType}
                onChange={(e) => updateFilter('materialType', e.target.value)}
              >
                <option value="">All Materials</option>
                {MATERIAL_TYPES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Province</label>
              <input
                type="text"
                placeholder="Search province..."
                value={filters.province}
                onChange={(e) => updateFilter('province', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="deployment-filter-category" aria-labelledby="assignment-filter-title">
          <div className="deployment-filter-category-heading">
            <span className="deployment-filter-category-icon" aria-hidden="true">⌖</span>
            <div>
              <h3 id="assignment-filter-title">Assignment</h3>
              <p>Filter by deployment location or project</p>
            </div>
          </div>
          <div className="deployment-filter-fields">
            <div className="filter-group">
              <label>DU</label>
              <select
                value={filters.duCode}
                onChange={(e) => updateFilter('duCode', e.target.value)}
              >
                <option value="">All DUs</option>
                {dus.map((du) => (
                  <option key={du.id} value={du.code}>{du.code}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Project</label>
              <select
                value={filters.projectCode}
                onChange={(e) => updateFilter('projectCode', e.target.value)}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.code}>{p.code}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section
          className="deployment-filter-category deployment-filter-period"
          aria-labelledby="period-filter-title"
        >
          <div className="deployment-filter-category-heading">
            <span className="deployment-filter-category-icon" aria-hidden="true">◷</span>
            <div>
              <h3 id="period-filter-title">Status &amp; dates</h3>
              <p>Focus on a status or deployment period</p>
            </div>
          </div>
          <div className="deployment-filter-fields">
            <div className="filter-group deployment-status-filter">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="deployment-date-filters">
              <div className="filter-group">
                <label>From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};
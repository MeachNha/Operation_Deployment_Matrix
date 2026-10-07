import React from 'react';

const MATERIAL_TYPES = ['BCS', 'TSC', 'EOD', 'BAC', 'FMT', 'DUO', 'IDT'];

export const FilterBar = ({
  filters,
  updateFilter,
  resetFilters,
  dus = [],
  projects = [],
}) => {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>DU</label>
        <select
          value={filters.duCode}
          onChange={(e) => updateFilter('duCode', e.target.value)}
        >
          <option value="">All DUs</option>
          {dus.map((du) => (
            <option key={du.id} value={du.code}>
              {du.code}
            </option>
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
            <option key={p.id} value={p.code}>
              {p.code}
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
            <option key={m} value={m}>
              {m}
            </option>
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

      <div className="filter-group">
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

      <button className="btn-reset" onClick={resetFilters}>
        Reset
      </button>
    </div>
  );
};
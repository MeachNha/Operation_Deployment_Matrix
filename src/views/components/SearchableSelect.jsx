import React, { useState, useEffect, useRef, useMemo } from 'react';

export const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Search...',
  getLabel = (opt) => opt.label || opt.name || opt.code,
  getValue = (opt) => opt.id,
  filterKeys = ['name', 'code'],   // which fields to search in
  emptyMessage = 'No matches found',
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find the currently selected option
  const selected = useMemo(
    () => options.find((o) => getValue(o) === value),
    [options, value, getValue]
  );

  // Filter options by query
  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase().trim();
    return options.filter((opt) => {
      return filterKeys.some((key) => {
        const val = opt[key];
        return val && String(val).toLowerCase().includes(q);
      });
    });
  }, [options, query, filterKeys]);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt) => {
    onChange(getValue(opt));
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }

    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightedIndex]) {
        handleSelect(filtered[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="searchable-select" ref={containerRef}>
      <div
        className={`searchable-select-control ${disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {!open && selected ? (
          <span className="searchable-select-value">{getLabel(selected)}</span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className="searchable-select-input"
            placeholder={selected ? getLabel(selected) : placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        )}
        <span className="searchable-select-arrow">▾</span>
      </div>

      {open && (
        <div className="searchable-select-dropdown">
          {filtered.length === 0 ? (
            <div className="searchable-select-empty">{emptyMessage}</div>
          ) : (
            <div className="searchable-select-list">
              {filtered.slice(0, 100).map((opt, idx) => {
                const val = getValue(opt);
                const isSelected = val === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={val}
                    className={`searchable-select-option ${
                      isSelected ? 'selected' : ''
                    } ${isHighlighted ? 'highlighted' : ''}`}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(opt)}
                  >
                    {getLabel(opt)}
                  </div>
                );
              })}
              {filtered.length > 100 && (
                <div className="searchable-select-more">
                  … {filtered.length - 100} more. Refine your search.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
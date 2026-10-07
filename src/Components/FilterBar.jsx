import React from 'react';
import { ROUNDS } from '../Utils/helpers';

function FilterBar({
  searchQuery = '',
  onSearchChange,
  selectedRound,
  filterStatus,
  onRoundChange,
  setFilterStatus,
  onKeyDown,
}) {
  const currentStatus = selectedRound || filterStatus || 'All';

  const handleStatusChange = (status) => {
    if (typeof onRoundChange === 'function') onRoundChange(status);
    if (typeof setFilterStatus === 'function') setFilterStatus(status);
  };

  const hasActiveFilter = Boolean(searchQuery.trim()) || currentStatus !== 'All';

  const handleClearSearch = () => {
    if (typeof onSearchChange === 'function') onSearchChange('');
  };

  // Safely fallback and filter out 'All' if already present in ROUNDS
  const rawRounds = Array.isArray(ROUNDS) ? ROUNDS : [
    'Saved',
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Rejected',
  ];
  const availableStatuses = rawRounds.filter((status) => status !== 'All');

  return (
    <section
      className={`filter-bar ${hasActiveFilter ? 'is-active' : ''}`}
      aria-label="Filter applications"
      onKeyDown={onKeyDown}
    >
      {/* Search Input */}
      {typeof onSearchChange === 'function' && (
        <div className="search-field">
          <label htmlFor="search-input" className="sr-only">
            Search by company or role
          </label>

          <div className="search-input-wrapper">
            <input
              id="search-input"
              type="search"
              placeholder="Search by company or role... (Esc to clear)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="filter-search-input"
            />

            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={handleClearSearch}
                aria-label="Clear search input"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Quick-Buttons / Chips */}
      <div className="filter-chips" role="group" aria-label="Status filter buttons">
        <button
          type="button"
          className={`filter-btn ${currentStatus === 'All' ? 'active' : ''}`}
          onClick={() => handleStatusChange('All')}
          aria-pressed={currentStatus === 'All'}
        >
          All
        </button>
        {availableStatuses.map((status) => (
          <button
            key={status}
            type="button"
            className={`filter-btn ${currentStatus === status ? 'active' : ''}`}
            onClick={() => handleStatusChange(status)}
            aria-pressed={currentStatus === status}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Dropdown Fallback Select for Screen Readers / Mobile */}
      <div className="filter-field sr-only-mobile">
        <label htmlFor="round-filter" className="sr-only">
          Filter by status or round
        </label>

        <select
          id="round-filter"
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Statuses</option>
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

export default FilterBar;
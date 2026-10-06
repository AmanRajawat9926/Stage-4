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
    if (onRoundChange) onRoundChange(status);
    if (setFilterStatus) setFilterStatus(status);
  };

  const hasActiveFilter = searchQuery.trim() !== '' || currentStatus !== 'All';

  const handleClearSearch = () => {
    if (onSearchChange) onSearchChange('');
  };

  const availableStatuses = ROUNDS || [
    'Saved',
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Rejected',
  ];

  return (
    <section
      className={`filter-bar ${hasActiveFilter ? 'is-active' : ''}`}
      aria-label="Filter applications"
      onKeyDown={onKeyDown}
    >
      {/* Search Input */}
      {onSearchChange && (
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
        >
          All
        </button>
        {availableStatuses.map((status) => (
          <button
            key={status}
            type="button"
            className={`filter-btn ${currentStatus === status ? 'active' : ''}`}
            onClick={() => handleStatusChange(status)}
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
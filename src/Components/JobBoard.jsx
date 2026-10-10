import React, { useState } from 'react';
import { useJobBoard } from '../Hooks/useJobBoard';
import JobCard from './JobCard';
import JobDetailModal from './JobDetailModal';

export default function JobBoard({ onTrackJob }) {
  const {
    jobs,
    searchQuery,
    isRemoteOnly,
    currentPage,
    totalPages,
    status,
    errorMsg,
    handleSearchChange,
    handleRemoteToggle,
    setCurrentPage,
    retry,
  } = useJobBoard();

  const [selectedJob, setSelectedJob] = useState(null);

  const handleFormSubmit = (event) => {
    event.preventDefault();
  };

  const handleFormKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      handleSearchChange('');
    }
  };

  const handleTrack = (job) => {
    if (typeof onTrackJob === 'function') {
      onTrackJob({
        ...job,
        company_name:
          job.company_name || 'Unknown Company',
        title: job.title || 'Untitled Role',
        round: 'Applied',
      });
    }
  };

  const displayError =
    errorMsg &&
    errorMsg.toLowerCase().includes('network')
      ? 'Failed to fetch jobs'
      : errorMsg || 'Failed to fetch jobs';

  return (
    <div className="job-board-container">
      <h2>External Job Board</h2>

      <form
        className="job-board-filters"
        onSubmit={handleFormSubmit}
        onKeyDown={handleFormKeyDown}
      >
        <div className="search-field">
          <input
            type="search"
            aria-label="Search jobs"
            placeholder="Search jobs by title, company, or tech..."
            value={searchQuery}
            onChange={(event) =>
              handleSearchChange(event.target.value)
            }
          />

          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => handleSearchChange('')}
              aria-label="Clear job search"
            >
              ✕
            </button>
          )}
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isRemoteOnly}
            onChange={(event) =>
              handleRemoteToggle(event.target.checked)
            }
            aria-label="Show remote jobs only"
          />

          Remote Only
        </label>
      </form>

      {status === 'loading' && (
        <div
          className="jobs-skeleton-grid"
          aria-label="Loading jobs"
          role="status"
        >
          {[...Array(6)].map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="skeleton-card"
            >
              <div className="skeleton-line title" />
              <div className="skeleton-line company" />
              <div className="skeleton-line location" />
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div
          className="state-card error-state"
          role="alert"
        >
          <h3>Unable to load jobs</h3>

          <p>{displayError}</p>

          <button
            type="button"
            className="btn-retry"
            onClick={retry}
          >
            Retry
          </button>
        </div>
      )}

      {status === 'empty' && (
        <div className="state-card empty-state">
          <h3>No jobs found</h3>

          <p>
            {isRemoteOnly
              ? 'No remote jobs matched your search. Try another search or turn off Remote Only.'
              : 'Try adjusting your search query.'}
          </p>
        </div>
      )}

      {status === 'success' && (
        <>
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobCard
                key={job.id || job.slug}
                job={job}
                onTrackJob={handleTrack}
                onViewDetails={setSelectedJob}
              />
            ))}
          </div>

          <div
            className="pagination-bar"
            aria-label="Job pagination navigation"
          >
            <button
              type="button"
              className="btn-page"
              disabled={currentPage <= 1}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(1, page - 1)
                )
              }
            >
              Previous
            </button>

            <span aria-live="polite">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="btn-page"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(
                    totalPages,
                    page + 1
                  )
                )
              }
            >
              Next
            </button>
          </div>
        </>
      )}

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onTrackJob={handleTrack}
        />
      )}
    </div>
  );
}
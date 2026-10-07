import React, { useState } from 'react';
import { useJobBoard } from '../Hooks/useJobBoard';
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      handleSearchChange('');
    }
  };

  const handleTrack = (job) => {
    if (typeof onTrackJob === 'function') {
      onTrackJob({
        ...job,
        company_name: job.company_name || 'Unknown Company',
        title: job.title || 'Untitled Role',
        round: 'Applied',
      });
    }
  };

  const displayError =
    errorMsg && errorMsg.toLowerCase().includes('network')
      ? 'Failed to fetch jobs'
      : errorMsg || 'Failed to fetch jobs';

  return (
    <div className="job-board-container">
      <h2>External Job Board</h2>

      {/* Search & Filter Controls */}
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
            value={typeof searchQuery === 'string' ? searchQuery : ''}
            onChange={(e) => handleSearchChange(e.target.value)}
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
            onChange={(e) => handleRemoteToggle(e.target.checked)}
            aria-label="Show remote jobs only"
          />
          Remote Only
        </label>
      </form>

      {/* Loading Skeleton View */}
      {status === 'loading' && (
        <div
          className="jobs-skeleton-grid"
          aria-label="Loading jobs"
          role="status"
        >
          {[...Array(6)].map((_, index) => (
            <div key={`skeleton-${index}`} className="skeleton-card">
              <div className="skeleton-line title" />
              <div className="skeleton-line company" />
              <div className="skeleton-line location" />
            </div>
          ))}
        </div>
      )}

      {/* Error State View */}
      {status === 'error' && (
        <div className="state-card error-state" role="alert">
          <h3>Unable to load jobs</h3>
          <p>{displayError}</p>
          <button type="button" className="btn-retry" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {/* Empty State View */}
      {status === 'empty' && (
        <div className="state-card empty-state">
          <h3>No jobs found</h3>
          <p>
            {isRemoteOnly
              ? 'No remote jobs matching your criteria were found on this page. Try changing filters or navigating pages.'
              : 'Try adjusting your search query or clear filters.'}
          </p>
        </div>
      )}

      {/* Successful Job List View */}
      {status === 'success' && (
        <>
          <div className="jobs-grid">
            {jobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-card-header">
                  <span className="job-company">{job.company_name}</span>
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-location">
                    {job.location || 'Location not specified'}
                  </p>

                  {job.remote && (
                    <span className="remote-badge">
                      <span className="pulse-dot" />
                      Remote
                    </span>
                  )}

                  <div className="job-tags">
                    {Array.isArray(job.tags) &&
                      job.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="tag-chip">
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="job-card-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setSelectedJob(job)}
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    className="btn-track"
                    onClick={() => handleTrack(job)}
                  >
                    + Track Job
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div
              className="pagination-bar"
              aria-label="Job pagination navigation"
            >
              <button
                type="button"
                className="btn-page"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Accessible Job Details Modal */}
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
import React, { useEffect, useState } from 'react';
import { mapJobData } from '../Utils/sanitize';

const API_URL = 'https://www.arbeitnow.com/api/job-board-api';

export default function JobBoard({ onTrackJob }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [retryCount, setRetryCount] = useState(0);

  /*
   * Debounce search input by 300ms.
   * Whenever the search changes, pagination starts again
   * from page 1.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /*
   * Fetch jobs from Arbeitnow.
   *
   * AbortController prevents an old request from remaining
   * active when page/search changes.
   *
   * The signal.aborted checks also protect against stale
   * responses in tests or environments where a request
   * still resolves after being aborted.
   */
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('page', String(page));

        if (debouncedQuery) {
          params.set('search', debouncedQuery);
        }

        const response = await fetch(
          `${API_URL}?${params.toString()}`,
          { signal }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load jobs (Status: ${response.status})`
          );
        }

        const data = await response.json();

        /*
         * The request may have been aborted while the response
         * was being processed. Do not allow stale data to update
         * the UI.
         */
        if (signal.aborted) {
          return;
        }

        const rawJobs = Array.isArray(data.data) ? data.data : [];

        const mappedJobs = rawJobs
          .map(mapJobData)
          .filter(Boolean);

        setJobs(mappedJobs);

        const apiLastPage = Number(data.meta?.last_page);

        setTotalPages(
          Number.isFinite(apiLastPage) && apiLastPage > 0
            ? apiLastPage
            : 1
        );
      } catch (err) {
        if (err.name === 'AbortError' || signal.aborted) {
          return;
        }

        setError(
          err.message || 'An error occurred while fetching jobs.'
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      controller.abort();
    };
  }, [page, debouncedQuery, retryCount]);

  /*
   * Remote-only filtering is performed locally on the
   * currently loaded API page.
   */
  const filteredJobs = jobs.filter((job) => {
    const matchesRemote = !remoteOnly || job.remote === true;

    const query = debouncedQuery.toLowerCase().trim();

    if (!query) {
      return matchesRemote;
    }

    const title = String(job.title || '').toLowerCase();
    const company = String(job.company_name || '').toLowerCase();

    const tags = Array.isArray(job.tags)
      ? job.tags.map((tag) => String(tag).toLowerCase())
      : [];

    const matchesQuery =
      title.includes(query) ||
      company.includes(query) ||
      tags.some((tag) => tag.includes(query));

    return matchesRemote && matchesQuery;
  });

  const handleRemoteChange = (event) => {
    setRemoteOnly(event.target.checked);
    setPage(1);
  };

  const handleRetry = () => {
    setRetryCount((count) => count + 1);
  };

  const handlePreviousPage = () => {
    setPage((currentPage) => Math.max(currentPage - 1, 1));
  };

  const handleNextPage = () => {
    setPage((currentPage) =>
      Math.min(currentPage + 1, totalPages)
    );
  };

  return (
    <div className="job-board-container">
      {/* Controls */}
      <div className="job-board-controls">
        <div className="search-input-wrapper">
          <label
            htmlFor="job-board-search"
            className="sr-only"
          >
            Search jobs
          </label>

          <input
            id="job-board-search"
            type="search"
            className="search-input"
            placeholder="Search jobs by title, company, or tech..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            aria-label="Search jobs"
          />

          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear job search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={handleRemoteChange}
            />

            <span>Remote Only</span>
          </label>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          className="jobs-skeleton-grid"
          aria-label="Loading jobs"
        >
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="skeleton-card"
              aria-hidden="true"
            >
              <div className="skeleton-line title" />
              <div className="skeleton-line company" />
              <div className="skeleton-line location" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="state-card error-state">
          <h3>Unable to load jobs</h3>

          <p>{error}</p>

          <button
            type="button"
            className="btn-retry"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredJobs.length === 0 && (
        <div className="state-card empty-state">
          <h3>No jobs found</h3>

          <p>
            Try adjusting your search query or turning off
            the remote-only filter.
          </p>
        </div>
      )}

      {/* Success State */}
      {!loading && !error && filteredJobs.length > 0 && (
        <>
          <div className="jobs-grid">
            {filteredJobs.map((job) => (
              <article
                key={job.id}
                className="job-card"
              >
                <div>
                  <span className="job-company">
                    {job.company_name}
                  </span>

                  <h3 className="job-title">
                    {job.title}
                  </h3>

                  <p className="job-location">
                    {job.location}
                  </p>

                  {job.remote && (
                    <span className="remote-badge">
                      <span className="pulse-dot" />
                      Remote
                    </span>
                  )}

                  <div
                    className="job-tags"
                    aria-label="Job tags"
                  >
                    {job.tags.slice(0, 4).map((tag, index) => (
                      <span
                        key={`${job.id}-tag-${index}`}
                        className="tag-chip"
                      >
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
                    onClick={() => onTrackJob(job)}
                  >
                    + Track Job
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div
            className="pagination-bar"
            aria-label="Job pagination"
          >
            <button
              type="button"
              className="btn-page"
              disabled={page <= 1 || loading}
              onClick={handlePreviousPage}
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              className="btn-page"
              disabled={page >= totalPages || loading}
              onClick={handleNextPage}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-details-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2 id="job-details-title">
              {selectedJob.title}
            </h2>

            <h4>
              {selectedJob.company_name} •{' '}
              {selectedJob.location}
            </h4>

            {selectedJob.remote && (
              <span className="remote-badge">
                <span className="pulse-dot" />
                Remote
              </span>
            )}

            <div className="modal-body">
              {/* description is already converted to plain text */}
              <p>{selectedJob.description}</p>
            </div>

            <div className="modal-actions">
              {selectedJob.url && (
                <a
                  href={selectedJob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-link"
                >
                  Apply on Original Site ↗
                </a>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedJob(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
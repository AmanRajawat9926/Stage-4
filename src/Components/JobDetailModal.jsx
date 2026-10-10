import React, { useEffect, useRef } from 'react';

import {
  mapJobData,
  formatJobUrl,
} from '../Utils/sanitize';

export default function JobDetailModal({
  job,
  onClose,
  onTrackJob,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const safeJob = mapJobData(job);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return undefined;

    previousFocusRef.current = document.activeElement;

    const getFocusableElements = () =>
      Array.from(
        dialog.querySelectorAll(
          'a[href], button:not([disabled]), ' +
          'input:not([disabled]), select:not([disabled]), ' +
          'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);

    dialog.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const elements = getFocusableElements();

      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);

      const previous = previousFocusRef.current;

      if (previous && typeof previous.focus === 'function') {
        previous.focus();
      }
    };
  }, [onClose]);

  if (!safeJob) return null;

  const {
    id,
    title,
    company_name,
    location,
    tags,
    remote,
    description,
  } = safeJob;

  const originalUrl = formatJobUrl(safeJob.url);

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        className="job-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-detail-title"
        aria-describedby="job-description-heading"
        tabIndex={-1}
      >
        <div className="modal-header">
          <div>
            <span className="job-company">
              {company_name}
            </span>

            <h2 id="job-detail-title">{title}</h2>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close job details"
          >
            ×
          </button>
        </div>

        <div className="job-detail-meta">
          <span>{location}</span>

          {remote && (
            <span className="remote-badge">Remote</span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="job-tags" aria-label="Job tags">
            {tags.slice(0, 5).map((tag, index) => (
              <span
                key={`${id}-detail-tag-${index}`}
                className="tag-chip"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <section
          className="job-description"
          aria-labelledby="job-description-heading"
        >
          <h3 id="job-description-heading">
            Job Description
          </h3>

          {description ? (
            <p>{description}</p>
          ) : (
            <p>
              No description is available for this position.
            </p>
          )}
        </section>

        <div className="modal-actions">
          {originalUrl && (
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-link"
            >
              View Original Posting ↗
            </a>
          )}

          {onTrackJob && (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                onTrackJob(safeJob);
                onClose?.();
              }}
            >
              Track this job
            </button>
          )}

          <button
            type="button"
            className="cancel-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
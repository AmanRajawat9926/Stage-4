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

  const safeJob = mapJobData(job);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener(
      'keydown',
      handleEscape
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  if (!safeJob) {
    return null;
  }

  const {
    title,
    company_name,
    location,
    tags,
    remote,
    description,
  } = safeJob;

  const originalUrl = formatJobUrl(safeJob.url);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="job-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-detail-title"
        tabIndex="-1"
      >
        <div className="modal-header">
          <div>
            <span className="job-company">
              {company_name}
            </span>

            <h2 id="job-detail-title">
              {title}
            </h2>
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
            <span className="remote-badge">
              Remote
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div
            className="job-tags"
            aria-label="Job tags"
          >
            {tags.slice(0, 5).map((tag, index) => (
              <span
                key={`${safeJob.id}-detail-tag-${index}`}
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
              No description is available for this
              position.
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
              Original Posting ↗
            </a>
          )}

          {onTrackJob && (
            <button
              type="button"
              className="btn-track"
              onClick={() => {
                onTrackJob(safeJob);
                onClose?.();
              }}
            >
              + Track this job
            </button>
          )}

          <button
            type="button"
            className="cancel-button"
            onClick={onClose}
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
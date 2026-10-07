import React, { useEffect, useRef } from 'react';

/**
 * Ensures job URL has an explicit http/https protocol prefix.
 */
function formatJobUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function JobDetailModal({ job, onClose, onTrackJob }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!job) return;

    // Store currently focused element to restore focus on unmount
    previousFocusRef.current = document.activeElement;

    // Lock body scrolling while modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Focus modal container on mount
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Keyboard navigation handlers (Escape to close, Tab to trap focus)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;

      // Restore focus on close
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [job, onClose]);

  if (!job) return null;

  // Property fallbacks for backend/API variance
  const safeTitle = job.title || 'Untitled Role';
  const safeCompany = job.company_name || job.company || 'Unknown Company';
  const safeLocation = job.location || 'Remote / Unspecified';
  const safeDescription = job.description || 'No detailed description available.';
  const safeTags = Array.isArray(job.tags) ? job.tags.filter(Boolean) : [];
  const formattedUrl = formatJobUrl(job.url || job.jobLink);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="modal-title">{safeTitle}</h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </header>

        <div className="modal-body">
          <p className="company-info">
            <strong>{safeCompany}</strong> &bull; {safeLocation}
            {job.remote && <span className="badge remote-badge">Remote</span>}
          </p>

          {safeTags.length > 0 && (
            <div className="tags-container" aria-label="Job tags">
              {safeTags.map((tag, idx) => (
                <span key={`${job.id || 'job'}-tag-${idx}`} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <hr />

          <div className="job-description-text">
            <h3>Description</h3>
            <div style={{ whiteSpace: 'pre-line' }}>{safeDescription}</div>
          </div>
        </div>

        <footer className="modal-footer">
          {formattedUrl && (
            <a
              href={formattedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary-button"
            >
              View Original Posting &rarr;
            </a>
          )}
          {onTrackJob && (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                onTrackJob(job);
                onClose?.();
              }}
            >
              Track This Job
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
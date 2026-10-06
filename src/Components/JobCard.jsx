import React from 'react';

/**
 * Safely converts HTML content to plain text without executing scripts
 */
export function sanitizeText(htmlContent) {
  if (!htmlContent) return '';
  
  try {
    const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
    return doc.body.textContent || '';
  } catch {
    // Fallback regex tag-stripper if DOMParser is unavailable
    return String(htmlContent).replace(/<[^>]*>?/gm, '');
  }
}

/**
 * Ensures link opens properly as external HTTP/HTTPS URL
 */
function formatJobUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function JobCard({ job = {}, onTrackJob }) {
  const safeTitle = sanitizeText(job.title || 'Untitled Role');
  const safeCompany = sanitizeText(job.company_name || job.company || 'Unknown Company');
  const safeLocation = sanitizeText(job.location || 'Remote / Unspecified');
  const formattedUrl = formatJobUrl(job.url || job.jobLink);

  return (
    <article className="job-card" data-testid="job-card">
      <div className="job-card-header">
        <div>
          <span className="job-company">{safeCompany}</span>
          <h3 className="job-title">{safeTitle}</h3>
        </div>

        {job.remote && (
          <span className="remote-badge">
            <span className="pulse-dot"></span> Remote
          </span>
        )}
      </div>

      <div className="job-location">
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          ></path>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
        <span>{safeLocation}</span>
      </div>

      {Array.isArray(job.tags) && job.tags.length > 0 && (
        <div className="job-tags" aria-label="Job tags">
          {job.tags.slice(0, 5).map((tag, idx) => (
            <span key={idx} className="tag-chip">
              {sanitizeText(tag)}
            </span>
          ))}
        </div>
      )}

      <div className="job-card-footer">
        {formattedUrl && (
          <a
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link"
            title={`View ${safeTitle} listing in new tab`}
          >
            View Listing ↗
          </a>
        )}

        {onTrackJob && (
          <button
            type="button"
            className="btn-track"
            onClick={() => onTrackJob(job)}
            aria-label={`Track job: ${safeTitle} at ${safeCompany}`}
          >
            + Track this job
          </button>
        )}
      </div>
    </article>
  );
}
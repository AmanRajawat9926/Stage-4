import React from 'react';

export function sanitizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formats a given job URL to ensure it has a valid protocol prefix (https://).
 */
export function formatJobUrl(url) {
  if (!url) {
    return '';
  }

  const trimmed = String(url).trim();

  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/**
 * JobCard Component
 * Displays individual job listing details with accessibility labels and formatted links.
 */
export default function JobCard({
  job = {},
  onTrackJob,
  onViewDetails,
}) {
  const safeTitle = sanitizeText(
    job.title || 'Untitled Role'
  );

  const safeCompany = sanitizeText(
    job.company_name ||
      job.company ||
      'Unknown Company'
  );

  const safeLocation = sanitizeText(
    job.location ||
      'Remote / Unspecified'
  );

  const safeTags = Array.isArray(job.tags)
    ? job.tags
        .map((tag) => sanitizeText(tag))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const formattedUrl = formatJobUrl(
    job.url || job.jobLink
  );

  return (
    <article
      className="job-card"
      data-testid="job-card"
    >
      <div className="job-card-header">
        <div>
          <span className="job-company">
            {safeCompany}
          </span>

          <h3 className="job-title">
            {safeTitle}
          </h3>
        </div>

        {job.remote && (
          <span className="remote-badge">
            <span
              className="pulse-dot"
              aria-hidden="true"
            />
            Remote
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
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>

        <span>{safeLocation}</span>
      </div>

      {safeTags.length > 0 && (
        <div
          className="job-tags"
          aria-label="Job tags"
        >
          {safeTags.map((tag, index) => (
            <span
              key={`${job.id || 'job'}-tag-${index}`}
              className="tag-chip"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="job-card-footer">
        {onViewDetails && (
          <button
            type="button"
            className="btn-secondary"
            onClick={(event) =>
              onViewDetails(
                job,
                event.currentTarget
              )
            }
            aria-label={`View details for ${safeTitle} at ${safeCompany}`}
          >
            View Details
          </button>
        )}

        {formattedUrl && (
          <a
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link"
            aria-label={`View ${safeTitle} listing in new tab`}
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
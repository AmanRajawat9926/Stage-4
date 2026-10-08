import React from 'react';
import {
  mapJobData,
  formatJobUrl,
} from '../Utils/sanitize';

// Kept for existing App.test.jsx compatibility.
export function sanitizeText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function JobCard({
  job = {},
  onTrackJob,
  onViewDetails,
}) {
  const safeJob = mapJobData(job);

  if (!safeJob) {
    return null;
  }

  const {
    title,
    company_name,
    location,
    tags,
    remote,
  } = safeJob;

  const formattedUrl = formatJobUrl(safeJob.url);

  return (
    <article
      className="job-card"
      data-testid="job-card"
    >
      <div className="job-card-header">
        <div>
          <span className="job-company">
            {company_name}
          </span>

          <h3 className="job-title">
            {title}
          </h3>
        </div>

        {remote && (
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

        <span>{location}</span>
      </div>

      {tags.length > 0 && (
        <div
          className="job-tags"
          aria-label="Job tags"
        >
          {tags.slice(0, 5).map((tag, index) => (
            <span
              key={`${safeJob.id}-tag-${index}`}
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
            onClick={() => onViewDetails(safeJob)}
            aria-label={`View details for ${title} at ${company_name}`}
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
            aria-label={`View ${title} listing in new tab`}
          >
            View Listing ↗
          </a>
        )}

        {onTrackJob && (
          <button
            type="button"
            className="btn-track"
            onClick={() => onTrackJob(safeJob)}
            aria-label={`Track job: ${title} at ${company_name}`}
          >
            + Track this job
          </button>
        )}
      </div>
    </article>
  );
}
import React from 'react';
import { useState, useMemo } from 'react';
import {
  calculateDaysSinceApplied,
  isApplicationStale,
  formatUrl,
  getDerivedRound,
  INTERVIEW_ROUND_TYPES,
  getTodayString,
} from '../Utils/helpers';

const INITIAL_INTERVIEW_FORM = {
  type: 'Phone Screen',
  date: getTodayString(),
  note: '',
};

function ApplicationItem({
  application,
  onEdit,
  onDelete,
  onStatusChange,
  onAddInterviewRound,
  onRemoveInterviewRound,
}) {
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const currentRound = application.status || getDerivedRound(application);
  const badgeClass = `badge-${currentRound.toLowerCase().replace(/\s+/g, '-')}`;

  const daysSince = application.appliedDate
    ? calculateDaysSinceApplied(application.appliedDate)
    : null;
  const isStale = isApplicationStale ? isApplicationStale(application) : false;
  const hrefUrl = application.jobLink ? formatUrl(application.jobLink) : null;

  const sortedHistory = useMemo(() => {
    return Array.isArray(application.history)
      ? [...application.history].sort((a, b) => {
          const dateA = new Date(a.changedAt).getTime() || 0;
          const dateB = new Date(b.changedAt).getTime() || 0;
          return dateB - dateA;
        })
      : [];
  }, [application.history]);

  const interviewRounds = Array.isArray(application.interviewRounds)
    ? application.interviewRounds
    : [];

  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewForm, setInterviewForm] = useState(INITIAL_INTERVIEW_FORM);
  const [interviewErrors, setInterviewErrors] = useState({});

  const resetInterviewForm = () => {
    setInterviewForm({
      ...INITIAL_INTERVIEW_FORM,
      date: getTodayString(),
    });
    setInterviewErrors({});
    setShowInterviewForm(false);
  };

  const validateInterviewRound = () => {
    const errors = {};
    if (!interviewForm.type) {
      errors.type = 'Interview type is required.';
    }
    if (!interviewForm.date) {
      errors.date = 'Interview date is required.';
    }
    return errors;
  };

  const handleInterviewChange = (e) => {
    const { name, value } = e.target;

    setInterviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setInterviewErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleInterviewSubmit = (e) => {
    if (e) e.preventDefault();

    const errors = validateInterviewRound();
    if (Object.keys(errors).length > 0) {
      setInterviewErrors(errors);
      return;
    }

    if (onAddInterviewRound) {
      onAddInterviewRound(application.id, {
        id: generateId(),
        type: interviewForm.type,
        date: interviewForm.date,
        note: interviewForm.note.trim(),
      });
    }

    resetInterviewForm();
  };

  const handleInterviewKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      resetInterviewForm();
    }
  };

  const formatDateLabel = (dateStr) => {
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleString();
  };

  return (
    <article
      className={`application-item card ${isStale ? 'is-stale' : ''}`}
      data-testid="application-row"
    >
      <div className="application-details">
        <div className="title-row">
          <h3 className="company-title">{application.company}</h3>

          {onStatusChange ? (
            <select
              value={currentRound}
              onChange={(e) => onStatusChange(application.id, e.target.value)}
              className={`status-select ${badgeClass}`}
            >
              <option value="Saved">Saved</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          ) : (
            <span className={`round-badge ${badgeClass}`}>
              {currentRound}
            </span>
          )}

          {isStale && (
            <span
              className="stale-badge"
              title="Application has been in Applied/Screen for more than 14 days"
            >
              ⚠️ Stale (&gt;14d)
            </span>
          )}
        </div>

        <p className="role-text">{application.role}</p>

        <div className="meta-row">
          <span className="meta-applied">
            <strong>Applied:</strong> {application.appliedDate || 'N/A'}
          </span>

          {daysSince !== null && (
            <span className="days-ago">
              ({daysSince} {daysSince === 1 ? 'day' : 'days'} ago)
            </span>
          )}

          {hrefUrl && (
            <>
              <span className="meta-separator">•</span>
              <a
                href={hrefUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="job-link"
                title="Open job link in new tab"
              >
                Job Link ↗
              </a>
            </>
          )}
        </div>

        {/* Interview Rounds */}
        {onAddInterviewRound && (
          <section
            className="application-detail-section"
            aria-label="Interview rounds"
          >
            <div className="detail-section-header">
              <h4>Interview Rounds ({interviewRounds.length})</h4>

              <button
                type="button"
                className="add-round-button"
                onClick={() => {
                  if (showInterviewForm) {
                    resetInterviewForm();
                  } else {
                    setShowInterviewForm(true);
                  }
                }}
              >
                {showInterviewForm ? 'Cancel' : '+ Add Interview Round'}
              </button>
            </div>

            {showInterviewForm && (
              <form
                className="interview-round-form"
                onSubmit={handleInterviewSubmit}
                onKeyDown={handleInterviewKeyDown}
                noValidate
                aria-label={`Add interview round for ${application.company}`}
              >
                <div
                  className={`form-field ${
                    interviewErrors.type ? 'has-error' : ''
                  }`}
                >
                  <label htmlFor={`round-type-${application.id}`}>
                    Type *
                  </label>

                  <select
                    id={`round-type-${application.id}`}
                    name="type"
                    value={interviewForm.type}
                    onChange={handleInterviewChange}
                    className={interviewErrors.type ? 'input-error' : ''}
                    aria-invalid={Boolean(interviewErrors.type)}
                  >
                    {(INTERVIEW_ROUND_TYPES || [
                      'Phone Screen',
                      'Technical',
                      'Behavioral',
                      'System Design',
                      'HR / Culture Fit',
                    ]).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className={`form-field ${
                    interviewErrors.date ? 'has-error' : ''
                  }`}
                >
                  <label htmlFor={`round-date-${application.id}`}>
                    Date *
                  </label>

                  <input
                    id={`round-date-${application.id}`}
                    name="date"
                    type="date"
                    value={interviewForm.date}
                    onChange={handleInterviewChange}
                    className={interviewErrors.date ? 'input-error' : ''}
                  />
                </div>

                <div className="form-field full-width">
                  <label htmlFor={`round-note-${application.id}`}>Note</label>

                  <input
                    id={`round-note-${application.id}`}
                    name="note"
                    type="text"
                    value={interviewForm.note}
                    onChange={handleInterviewChange}
                    placeholder="e.g. DSA + JavaScript discussion"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="primary-button">
                    Add Round
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={resetInterviewForm}
                  >
                    Cancel (Esc)
                  </button>
                </div>
              </form>
            )}

            {interviewRounds.length === 0 ? (
              <p className="detail-empty">No interview rounds scheduled.</p>
            ) : (
              <ul className="interview-round-list">
                {interviewRounds.map((round) => (
                  <li key={round.id || round.date} className="interview-round-summary">
                    <div className="interview-round-info">
                      <strong>{round.type}</strong>
                      <span>{round.date}</span>
                      {round.note && <span>— {round.note}</span>}
                    </div>

                    {onRemoveInterviewRound && (
                      <button
                        type="button"
                        className="delete-round-button"
                        onClick={() =>
                          onRemoveInterviewRound(application.id, round.id)
                        }
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Transition History */}
        {sortedHistory.length > 0 && (
          <section
            className="history-section"
            aria-label="Transition history"
          >
            <h4>Transition History ({sortedHistory.length})</h4>
            <ul className="history-list">
              {sortedHistory.map((item, index) => (
                <li key={item.id || index} className="history-item">
                  <span>
                    {item.from && (
                      <>
                        <strong>{item.from}</strong>
                        {' → '}
                      </>
                    )}
                    <strong>{item.to}</strong>
                  </span>

                  <span>
                    {formatDateLabel(item.changedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="item-actions">
        {onEdit && (
          <button
            type="button"
            className="edit-button"
            onClick={() => onEdit(application.id)}
            aria-label={`Edit application for ${application.company}`}
          >
            Edit
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="delete-button"
            onClick={() => onDelete(application.id)}
            aria-label={`Delete application for ${application.company}`}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

export default ApplicationItem;
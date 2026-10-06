import { useState } from 'react';
import {
  ROUNDS,
  getTodayString,
  validateApplication,
  validateField,
  getDerivedRound,
} from '../Utils/helpers';

function EditApplicationRow({ application, onSave, onCancel }) {
  const currentRound = application.status || getDerivedRound(application);

  const [formData, setFormData] = useState({
    company: application.company || '',
    role: application.role || '',
    round: currentRound || 'Applied',
    appliedDate: application.appliedDate || getTodayString(),
    jobLink: application.jobLink || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (validateField) {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }));
    }
  };

  const handleSave = () => {
    if (validateApplication) {
      const validationErrors = validateApplication(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    const updatedHistory = Array.isArray(application.history)
      ? [...application.history]
      : [];

    let newTransition = null;

    if (formData.round !== currentRound) {
      const generatedId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `trans-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      newTransition = {
        id: generatedId,
        from: currentRound,
        to: formData.round,
        changedAt: new Date().toISOString(),
      };

      updatedHistory.push(newTransition);
    }

    const { round, stage, ...cleanApp } = application;

    const updatedApplication = {
      ...cleanApp,
      company: formData.company.trim(),
      role: formData.role.trim(),
      status: formData.round,
      history: updatedHistory,
      appliedDate: formData.appliedDate,
      jobLink: formData.jobLink.trim(),
    };

    onSave(updatedApplication, newTransition);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const availableRounds = ROUNDS || [
    'Saved',
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Rejected',
  ];

  return (
    <form
      className="application-item editing-card"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      noValidate
      aria-label={`Editing application for ${application.company}`}
    >
      <div className="edit-grid">
        {/* Company */}
        <div className={`form-field ${errors.company ? 'has-error' : ''}`}>
          <label htmlFor={`edit-company-${application.id}`}>Company *</label>
          <input
            id={`edit-company-${application.id}`}
            name="company"
            type="text"
            value={formData.company}
            onChange={handleChange}
            autoFocus
            className={errors.company ? 'input-error' : ''}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={
              errors.company ? `edit-company-error-${application.id}` : undefined
            }
          />
          {errors.company && (
            <p
              id={`edit-company-error-${application.id}`}
              className="error-message"
              role="alert"
            >
              {errors.company}
            </p>
          )}
        </div>

        {/* Role */}
        <div className={`form-field ${errors.role ? 'has-error' : ''}`}>
          <label htmlFor={`edit-role-${application.id}`}>Role *</label>
          <input
            id={`edit-role-${application.id}`}
            name="role"
            type="text"
            value={formData.role}
            onChange={handleChange}
            className={errors.role ? 'input-error' : ''}
            aria-invalid={Boolean(errors.role)}
            aria-describedby={
              errors.role ? `edit-role-error-${application.id}` : undefined
            }
          />
          {errors.role && (
            <p
              id={`edit-role-error-${application.id}`}
              className="error-message"
              role="alert"
            >
              {errors.role}
            </p>
          )}
        </div>

        {/* Round / Status */}
        <div className="form-field">
          <label htmlFor={`edit-round-${application.id}`}>Status / Round</label>
          <select
            id={`edit-round-${application.id}`}
            name="round"
            value={formData.round}
            onChange={handleChange}
          >
            {availableRounds.map((roundItem) => (
              <option key={roundItem} value={roundItem}>
                {roundItem}
              </option>
            ))}
          </select>
        </div>

        {/* Applied Date */}
        <div className={`form-field ${errors.appliedDate ? 'has-error' : ''}`}>
          <label htmlFor={`edit-appliedDate-${application.id}`}>Applied Date *</label>
          <input
            id={`edit-appliedDate-${application.id}`}
            type="date"
            name="appliedDate"
            max={getTodayString ? getTodayString() : undefined}
            value={formData.appliedDate}
            onChange={handleChange}
            className={errors.appliedDate ? 'input-error' : ''}
            aria-invalid={Boolean(errors.appliedDate)}
            aria-describedby={
              errors.appliedDate
                ? `edit-appliedDate-error-${application.id}`
                : undefined
            }
          />
          {errors.appliedDate && (
            <p
              id={`edit-appliedDate-error-${application.id}`}
              className="error-message"
              role="alert"
            >
              {errors.appliedDate}
            </p>
          )}
        </div>

        {/* Job Link */}
        <div className={`form-field full-width ${errors.jobLink ? 'has-error' : ''}`}>
          <label htmlFor={`edit-jobLink-${application.id}`}>Job Link</label>
          <input
            id={`edit-jobLink-${application.id}`}
            type="text"
            name="jobLink"
            value={formData.jobLink}
            onChange={handleChange}
            placeholder="https://..."
            className={errors.jobLink ? 'input-error' : ''}
            aria-invalid={Boolean(errors.jobLink)}
            aria-describedby={
              errors.jobLink ? `edit-jobLink-error-${application.id}` : undefined
            }
          />
          {errors.jobLink && (
            <p
              id={`edit-jobLink-error-${application.id}`}
              className="error-message"
              role="alert"
            >
              {errors.jobLink}
            </p>
          )}
        </div>
      </div>

      <div className="item-actions editing-actions">
        <button type="submit" className="save-button">
          Save Changes
        </button>

        <button
          type="button"
          className="cancel-button"
          onClick={onCancel}
        >
          Cancel (Esc)
        </button>
      </div>
    </form>
  );
}

export default EditApplicationRow;
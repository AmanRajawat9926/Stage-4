import React from 'react';
import { useState } from 'react';
import {
  ROUNDS,
  getTodayString,
  validateApplication,
  validateField,
  getDerivedRound,
} from '../Utils/helpers';

function EditApplicationRow({ application = {}, onSave, onCancel }) {
  const appId = application.id || 'temp';
  const currentRound = application.status || (getDerivedRound ? getDerivedRound(application) : '') || 'Applied';

  const [formData, setFormData] = useState({
    company: application.company || '',
    role: application.role || '',
    round: currentRound,
    appliedDate: application.appliedDate || (getTodayString ? getTodayString() : ''),
    jobLink: application.jobLink || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (typeof validateField === 'function') {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }));
    }
  };

  const handleSave = () => {
    if (typeof validateApplication === 'function') {
      const validationErrors = validateApplication(formData);
      if (validationErrors && Object.keys(validationErrors).length > 0) {
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

    if (typeof onSave === 'function') {
      onSave(updatedApplication, newTransition);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (typeof onCancel === 'function') {
        onCancel();
      }
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
      aria-label={`Editing application for ${application.company || 'position'}`}
    >
      <div className="edit-grid">
        {/* Company */}
        <div className={`form-field ${errors.company ? 'has-error' : ''}`}>
          <label htmlFor={`edit-company-${appId}`}>Company *</label>
          <input
            id={`edit-company-${appId}`}
            name="company"
            type="text"
            value={formData.company}
            onChange={handleChange}
            autoFocus
            className={errors.company ? 'input-error' : ''}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={
              errors.company ? `edit-company-error-${appId}` : undefined
            }
          />
          {errors.company && (
            <p
              id={`edit-company-error-${appId}`}
              className="error-message"
              role="alert"
            >
              {errors.company}
            </p>
          )}
        </div>

        {/* Role */}
        <div className={`form-field ${errors.role ? 'has-error' : ''}`}>
          <label htmlFor={`edit-role-${appId}`}>Role *</label>
          <input
            id={`edit-role-${appId}`}
            name="role"
            type="text"
            value={formData.role}
            onChange={handleChange}
            className={errors.role ? 'input-error' : ''}
            aria-invalid={Boolean(errors.role)}
            aria-describedby={
              errors.role ? `edit-role-error-${appId}` : undefined
            }
          />
          {errors.role && (
            <p
              id={`edit-role-error-${appId}`}
              className="error-message"
              role="alert"
            >
              {errors.role}
            </p>
          )}
        </div>

        {/* Round / Status */}
        <div className="form-field">
          <label htmlFor={`edit-round-${appId}`}>Status / Round</label>
          <select
            id={`edit-round-${appId}`}
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
          <label htmlFor={`edit-appliedDate-${appId}`}>Applied Date *</label>
          <input
            id={`edit-appliedDate-${appId}`}
            type="date"
            name="appliedDate"
            max={getTodayString ? getTodayString() : undefined}
            value={formData.appliedDate}
            onChange={handleChange}
            className={errors.appliedDate ? 'input-error' : ''}
            aria-invalid={Boolean(errors.appliedDate)}
            aria-describedby={
              errors.appliedDate
                ? `edit-appliedDate-error-${appId}`
                : undefined
            }
          />
          {errors.appliedDate && (
            <p
              id={`edit-appliedDate-error-${appId}`}
              className="error-message"
              role="alert"
            >
              {errors.appliedDate}
            </p>
          )}
        </div>

        {/* Job Link */}
        <div className={`form-field full-width ${errors.jobLink ? 'has-error' : ''}`}>
          <label htmlFor={`edit-jobLink-${appId}`}>Job Link</label>
          <input
            id={`edit-jobLink-${appId}`}
            type="text"
            name="jobLink"
            value={formData.jobLink}
            onChange={handleChange}
            placeholder="https://..."
            className={errors.jobLink ? 'input-error' : ''}
            aria-invalid={Boolean(errors.jobLink)}
            aria-describedby={
              errors.jobLink ? `edit-jobLink-error-${appId}` : undefined
            }
          />
          {errors.jobLink && (
            <p
              id={`edit-jobLink-error-${appId}`}
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
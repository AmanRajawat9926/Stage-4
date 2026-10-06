export const ROUNDS = [
  'Saved',
  'Applied',
  'Screen',
  'Interview',
  'Offer',
  'Rejected',
];

export const INTERVIEW_ROUND_TYPES = [
  'phone',
  'tech',
  'HR',
  'onsite',
];

/* --------------------------------------------------
   Internal Helpers
-------------------------------------------------- */

const generateUUID = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
};

/* --------------------------------------------------
   URL Helpers
-------------------------------------------------- */

export const formatUrl = (value) => {
  const trimmedValue = String(value ?? '').trim();

  if (!trimmedValue) {
    return '';
  }

  if (
    trimmedValue.startsWith('http://') ||
    trimmedValue.startsWith('https://')
  ) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
};

/* --------------------------------------------------
   Date Helpers
-------------------------------------------------- */

export const getTodayString = () => {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    today.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/* --------------------------------------------------
   Validation
-------------------------------------------------- */

export const validateField = (name, value) => {
  const trimmedValue = String(value ?? '').trim();

  if (name === 'company') {
    return !trimmedValue
      ? 'Company is required.'
      : '';
  }

  if (name === 'role') {
    return !trimmedValue
      ? 'Role is required.'
      : '';
  }

  if (name === 'appliedDate') {
    if (!trimmedValue) {
      return 'Applied date is required.';
    }

    if (trimmedValue > getTodayString()) {
      return 'Applied date cannot be in the future.';
    }

    return '';
  }

  if (name === 'jobLink') {
    if (!trimmedValue) {
      return 'Job link is required.';
    }

    try {
      const formattedUrl = formatUrl(trimmedValue);
      const parsedUrl = new URL(formattedUrl);

      return parsedUrl.protocol === 'http:' ||
        parsedUrl.protocol === 'https:'
        ? ''
        : 'Please enter a valid HTTP or HTTPS URL.';
    } catch {
      return 'Please enter a valid URL.';
    }
  }

  return '';
};

export const validateApplication = (formData) => {
  const errors = {};

  const fields = [
    'company',
    'role',
    'appliedDate',
    'jobLink',
  ];

  fields.forEach((field) => {
    const error = validateField(
      field,
      formData?.[field]
    );

    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

/* --------------------------------------------------
   Transition History
-------------------------------------------------- */

export const getSortedHistory = (application) => {
  if (
    !application ||
    !Array.isArray(application.history)
  ) {
    return [];
  }

  return [...application.history].sort((a, b) => {
    const timeA = new Date(
      a.changedAt
    ).getTime();

    const timeB = new Date(
      b.changedAt
    ).getTime();

    if (timeB !== timeA) {
      return timeB - timeA;
    }

    return String(b.id || '').localeCompare(
      String(a.id || '')
    );
  });
};

/**
 * Current round is derived from the last history entry.
 *
 * History is the source of truth instead of storing
 * a separate current round field.
 */
export const getDerivedRound = (application) => {
  if (
    !application ||
    !Array.isArray(application.history) ||
    application.history.length === 0
  ) {
    return (
      application?.status ||
      application?.round ||
      'Applied'
    );
  }

  const lastTransition =
    application.history[
      application.history.length - 1
    ];

  return lastTransition?.to || 'Applied';
};

/* --------------------------------------------------
   Migration
-------------------------------------------------- */

export const migrateApplications = (apps) => {
  if (!Array.isArray(apps)) {
    return [];
  }

  return apps.map((app) => {
    /*
     * Support old Stage 1 data.
     */
    const legacyRound =
      app.round ||
      app.stage ||
      app.status ||
      'Applied';

    /*
     * Remove old source-of-truth fields.
     * Current round comes from history.
     */
    const {
      round,
      stage,
      status,
      ...cleanApp
    } = app;

    /*
     * Already migrated applications keep their
     * existing transition history.
     */
    if (
      Array.isArray(app.history) &&
      app.history.length > 0
    ) {
      return {
        ...cleanApp,

        history: [...app.history],

        interviewRounds:
          Array.isArray(app.interviewRounds)
            ? [...app.interviewRounds]
            : [],
      };
    }

    /*
     * Create exactly one transition for old records.
     */
    const migrationTimestamp =
      app.createdAt
        ? new Date(
            app.createdAt
          ).toISOString()
        : new Date().toISOString();

    const initialTransition = {
      id: `trans-migrated-${
        app.id || generateUUID()
      }`,
      from: null,
      to: legacyRound,
      changedAt: migrationTimestamp,
    };

    return {
      ...cleanApp,

      history: [initialTransition],

      interviewRounds:
        Array.isArray(app.interviewRounds)
          ? [...app.interviewRounds]
          : [],
    };
  });
};

/* --------------------------------------------------
   Application Age & Stale Checks
-------------------------------------------------- */

export const calculateDaysSinceApplied = (
  appliedDate
) => {
  if (!appliedDate) {
    return 0;
  }

  const [year, month, day] =
    appliedDate.split('-').map(Number);

  if (!year || !month || !day) {
    return 0;
  }

  const appliedUtc = Date.UTC(
    year,
    month - 1,
    day
  );

  const [
    todayYear,
    todayMonth,
    todayDay,
  ] = getTodayString()
    .split('-')
    .map(Number);

  const todayUtc = Date.UTC(
    todayYear,
    todayMonth - 1,
    todayDay
  );

  const difference =
    todayUtc - appliedUtc;

  return Math.max(
    0,
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    )
  );
};

export const isApplicationStale = (
  application
) => {
  if (!application) {
    return false;
  }

  const currentRound =
    getDerivedRound(application);

  if (
    currentRound !== 'Applied' &&
    currentRound !== 'Screen'
  ) {
    return false;
  }

  return (
    calculateDaysSinceApplied(
      application.appliedDate
    ) > 14
  );
};

export const countStaleApplications = (
  applications
) => {
  if (!Array.isArray(applications)) {
    return 0;
  }

  return applications.filter(
    isApplicationStale
  ).length;
};

/* --------------------------------------------------
   Upcoming Interviews
-------------------------------------------------- */

export const isUpcomingInterview = (
  interviewRound
) => {
  if (!interviewRound?.date) {
    return false;
  }

  const [year, month, day] =
    interviewRound.date
      .split('-')
      .map(Number);

  if (!year || !month || !day) {
    return false;
  }

  const interviewUtc = Date.UTC(
    year,
    month - 1,
    day
  );

  const [
    todayYear,
    todayMonth,
    todayDay,
  ] = getTodayString()
    .split('-')
    .map(Number);

  const todayUtc = Date.UTC(
    todayYear,
    todayMonth - 1,
    todayDay
  );

  const sevenDaysLater =
    todayUtc +
    7 * 24 * 60 * 60 * 1000;

  return (
    interviewUtc >= todayUtc &&
    interviewUtc <= sevenDaysLater
  );
};

export const countUpcomingInterviews = (
  applications
) => {
  if (!Array.isArray(applications)) {
    return 0;
  }

  return applications.reduce(
    (count, application) => {
      const rounds =
        Array.isArray(
          application.interviewRounds
        )
          ? application.interviewRounds
          : [];

      return (
        count +
        rounds.filter(
          isUpcomingInterview
        ).length
      );
    },
    0
  );
};

/* --------------------------------------------------
   Display Helpers
-------------------------------------------------- */

export const formatRelativeTime = (
  dateString
) => {
  if (!dateString) {
    return '';
  }

  const timestamp =
    new Date(dateString).getTime();

  if (Number.isNaN(timestamp)) {
    return '';
  }

  const difference =
    Date.now() - timestamp;

  const seconds = Math.floor(
    difference / 1000
  );

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(
    seconds / 60
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(
    days / 30
  );

  return `${months}mo ago`;
};

export const formatExactDate = (
  dateString
) => {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
};

export function formatDate(dateString) {
  return formatExactDate(dateString);
}

export function sanitizeInput(str) {
  if (!str) {
    return '';
  }

  return String(str).replace(
    /[<>]/g,
    ''
  );
}

/* --------------------------------------------------
   Transition Factory
-------------------------------------------------- */

export const createTransition = (
  from,
  to
) => {
  return {
    id: `trans-${generateUUID()}`,
    from,
    to,
    changedAt:
      new Date().toISOString(),
  };
};
/**
 * Strips HTML tags and normalizes whitespace in HTML strings.
 * Inserts spacing around block elements to prevent words from running together.
 *
 * @param {string} htmlString - Raw HTML input string.
 * @returns {string} Plain text with standardized spacing.
 */
export const sanitizeHtmlToText = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') {
    return '';
  }

  try {
    const parser = new DOMParser();

    // Insert spaces after closing block-level elements before parsing
    const formattedHtml = htmlString.replace(
      /<\/(p|div|li|h[1-6]|br|tr|section|article)>/gi,
      '$& '
    );

    const parsedDocument = parser.parseFromString(
      formattedHtml,
      'text/html'
    );

    return (parsedDocument.body.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    // Regex fallback for non-DOM environments
    return htmlString
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
};

/**
 * Generates a standard UUID v4 or a random string fallback.
 *
 * @returns {string} Unique identifier string.
 */
const createFallbackId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Safely converts value to a string and trims it. Returns fallback if empty.
 *
 * @param {any} value - Input value to normalize.
 * @param {string} [fallback=''] - Fallback value if target is null/undefined/empty.
 * @returns {string} Normalized string output.
 */
const normalizeString = (value, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const trimmed = String(value).trim();

  return trimmed || fallback;
};

/**
 * Maps raw job application data into a standardized object structure.
 *
 * @param {Object} rawJob - Raw job data payload.
 * @returns {Object|null} Formatted job object or null if invalid input.
 */
export const mapJobData = (rawJob) => {
  if (!rawJob || typeof rawJob !== 'object') {
    return null;
  }

  const tags = Array.isArray(rawJob.tags)
    ? rawJob.tags
        .filter(
          (tag) =>
            typeof tag === 'string' || typeof tag === 'number'
        )
        .map((tag) => String(tag).trim())
        .filter(Boolean)
    : [];

  return {
    id: normalizeString(rawJob.slug, createFallbackId()),
    slug: normalizeString(rawJob.slug),
    company_name: normalizeString(
      rawJob.company_name || rawJob.company,
      'Unknown Company'
    ),
    title: normalizeString(
      rawJob.title || rawJob.role,
      'Untitled Role'
    ),
    location: normalizeString(
      rawJob.location,
      'Remote / Unspecified'
    ),
    remote: Boolean(rawJob.remote),
    tags,
    url: normalizeString(rawJob.url || rawJob.jobLink),
    description: sanitizeHtmlToText(rawJob.description),
    createdAt: rawJob.created_at || new Date().toISOString(),
  };
};
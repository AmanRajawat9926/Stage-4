/**
 * Converts API HTML description into safe plain text.
 *
 * No raw HTML is returned for rendering.
 */
export const sanitizeHtmlToText = (htmlString) => {
  if (
    htmlString === null ||
    htmlString === undefined
  ) {
    return '';
  }

  const value = String(htmlString);

  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();

      const formattedHtml = value.replace(
        /<\/(p|div|li|h[1-6]|br|tr|section|article)>/gi,
        '$& '
      );

      const document =
        parser.parseFromString(
          formattedHtml,
          'text/html'
        );

      return (document.body.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  } catch {
    // Fall through to regex fallback.
  }

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Converts a URL into an HTTP/HTTPS URL.
 */
export const formatJobUrl = (value) => {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

/**
 * Safely converts a value to a trimmed string.
 */
const normalizeString = (
  value,
  fallback = ''
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const result = String(value).trim();

  return result || fallback;
};

/**
 * Generates a fallback ID.
 */
const createFallbackId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

/**
 * Single production mapper for Arbeitnow jobs.
 *
 * All job data goes through this mapper before
 * reaching JobCard or JobDetailModal.
 */
export const mapJobData = (rawJob) => {
  if (
    !rawJob ||
    typeof rawJob !== 'object'
  ) {
    return null;
  }

  const tags = Array.isArray(rawJob.tags)
    ? rawJob.tags
        .filter(
          (tag) =>
            typeof tag === 'string' ||
            typeof tag === 'number'
        )
        .map((tag) =>
          String(tag).trim()
        )
        .filter(Boolean)
    : [];

  return {
    id:
      normalizeString(rawJob.slug) ||
      normalizeString(rawJob.id) ||
      createFallbackId(),

    slug: normalizeString(rawJob.slug),

    company_name: normalizeString(
      rawJob.company_name ||
        rawJob.company,
      'Unknown Company'
    ),

    title: normalizeString(
      rawJob.title ||
        rawJob.role,
      'Untitled Role'
    ),

    location: normalizeString(
      rawJob.location,
      'Remote / Unspecified'
    ),

    remote: Boolean(rawJob.remote),

    tags,

    url: normalizeString(
      rawJob.url ||
        rawJob.jobLink
    ),

    description:
      sanitizeHtmlToText(
        rawJob.description
      ),

    createdAt:
      rawJob.created_at ||
      null,
  };
};
/**
 * Converts API HTML description into plain text.
 *
 * We intentionally do not render the original HTML.
 * This prevents scripts and HTML event handlers from
 * executing in the React application.
 */
export const sanitizeHtmlToText = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') {
    return '';
  }

  try {
    const parser = new DOMParser();

    const parsedDocument = parser.parseFromString(
      htmlString,
      'text/html'
    );

    return parsedDocument.body.textContent || '';
  } catch {
    /*
     * Fallback for environments where DOMParser is not
     * available.
     */
    return htmlString.replace(/<[^>]*>/g, '');
  }
};

/**
 * Maps the Arbeitnow API response into the application's
 * internal job shape.
 */
export const mapJobData = (rawJob) => {
  if (!rawJob || typeof rawJob !== 'object') {
    return null;
  }

  const fallbackId =
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  const tags = Array.isArray(rawJob.tags)
    ? rawJob.tags
        .filter(
          (tag) =>
            typeof tag === 'string' ||
            typeof tag === 'number'
        )
        .map((tag) => String(tag))
    : [];

  return {
    id: rawJob.slug || fallbackId,

    slug:
      typeof rawJob.slug === 'string'
        ? rawJob.slug
        : '',

    company_name:
      typeof rawJob.company_name === 'string' &&
      rawJob.company_name.trim()
        ? rawJob.company_name.trim()
        : 'Unknown Company',

    title:
      typeof rawJob.title === 'string' &&
      rawJob.title.trim()
        ? rawJob.title.trim()
        : 'Untitled Role',

    location:
      typeof rawJob.location === 'string' &&
      rawJob.location.trim()
        ? rawJob.location.trim()
        : 'Remote',

    remote: Boolean(rawJob.remote),

    tags,

    url:
      typeof rawJob.url === 'string'
        ? rawJob.url.trim()
        : '',

    /*
     * Important:
     * API description may contain HTML.
     * Store only plain text in the application.
     */
    description: sanitizeHtmlToText(
      rawJob.description
    ),

    createdAt:
      rawJob.created_at ||
      new Date().toISOString(),
  };
};
import { useState, useEffect, useRef, useCallback } from 'react';
import { mapJobData as customMapJobData } from '../Utils/sanitize';

const API_BASE_URL = 'https://www.arbeitnow.com/api/job-board-api';

/**
 * Fallback sanitizer/mapper if imported mapJobData is unavailable.
 */
const defaultMapJobData = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: raw.slug || raw.id || String(Math.random()),
    title: raw.title || 'Untitled Position',
    company_name: raw.company_name || raw.company || 'Unknown Company',
    location: raw.location || 'Remote / Unspecified',
    remote: Boolean(raw.remote),
    tags: Array.isArray(raw.tags)
      ? raw.tags
      : Array.isArray(raw.job_types)
      ? raw.job_types
      : [],
    description: raw.description || '',
    url: raw.url || raw.jobLink || '',
  };
};

const mapJobData =
  typeof customMapJobData === 'function'
    ? customMapJobData
    : defaultMapJobData;

export function useJobBoard() {
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isRemoteOnly, setIsRemoteOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error' | 'empty'
  const [errorMsg, setErrorMsg] = useState(null);

  // Active AbortController reference for cleanup and retries
  const abortControllerRef = useRef(null);

  // 1. Debounce search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 2. Filter handlers (resets page to 1 on update)
  const handleSearchChange = useCallback((queryOrEvent) => {
    const val =
      queryOrEvent && typeof queryOrEvent === 'object' && 'target' in queryOrEvent
        ? queryOrEvent.target.value
        : queryOrEvent ?? '';

    setSearchQuery(val);
    setCurrentPage(1);
  }, []);

  const handleRemoteToggle = useCallback((remoteVal) => {
    setIsRemoteOnly((prev) => (typeof remoteVal === 'boolean' ? remoteVal : !prev));
    setCurrentPage(1);
  }, []);

  // 3. Main Data Fetching Function
  const loadJobs = useCallback(
    async (page, search, remoteFilter, signal) => {
      setStatus('loading');
      setErrorMsg(null);

      try {
        const url = new URL(API_BASE_URL);
        url.searchParams.set('page', String(page));

        if (search && search.trim()) {
          url.searchParams.set('search', search.trim());
        }

        const res = await fetch(url.toString(), { signal });

        // Guard against mocked fetches that don't auto-abort when signal aborts
        if (signal?.aborted) return;

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const responseData = await res.json();

        // Guard against late promise resolutions when signal was aborted during json parsing
        if (signal?.aborted) return;

        const rawList = Array.isArray(responseData.data) ? responseData.data : [];

        // Map & sanitize job objects
        let mappedList = rawList.map(mapJobData).filter(Boolean);

        // Apply client-side remote filter if enabled
        if (remoteFilter) {
          mappedList = mappedList.filter((job) => job.remote);
        }

        const pages =
          responseData.meta?.last_page ||
          responseData.meta?.total_pages ||
          1;

        setTotalPages(pages);

        if (mappedList.length === 0) {
          setJobs([]);
          setStatus('empty');
        } else {
          setJobs(mappedList);
          setStatus('success');
        }
      } catch (err) {
        if (err.name === 'AbortError' || signal?.aborted) {
          // Ignore cancellation aborts
          return;
        }
        setErrorMsg(err.message || 'Failed to fetch jobs.');
        setStatus('error');
      }
    },
    []
  );

  // 4. Trigger fetch on dependency changes
  useEffect(() => {
    // Abort previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    loadJobs(currentPage, debouncedSearch, isRemoteOnly, controller.signal);

    return () => {
      controller.abort();
    };
  }, [currentPage, debouncedSearch, isRemoteOnly, loadJobs]);

  // 5. Retry Handler
  const retry = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    loadJobs(currentPage, debouncedSearch, isRemoteOnly, controller.signal);
  }, [currentPage, debouncedSearch, isRemoteOnly, loadJobs]);

  return {
    jobs,
    searchQuery,
    isRemoteOnly,
    currentPage,
    totalPages,
    status,
    errorMsg,
    handleSearchChange,
    handleRemoteToggle,
    setCurrentPage,
    retry,
  };
}
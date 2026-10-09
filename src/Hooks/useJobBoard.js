import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import { mapJobData } from '../Utils/sanitize';

const API_BASE_URL =
  'https://www.arbeitnow.com/api/job-board-api';

const JOBS_PER_PAGE = 10;

export function useJobBoard() {
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isRemoteOnly, setIsRemoteOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState(null);

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  // Debounce search input by 300 ms.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = useCallback((valueOrEvent) => {
    const value =
      valueOrEvent &&
      typeof valueOrEvent === 'object' &&
      'target' in valueOrEvent
        ? valueOrEvent.target.value
        : valueOrEvent ?? '';

    setSearchQuery(String(value));
    setCurrentPage(1);
  }, []);

  const handleRemoteToggle = useCallback((value) => {
    setIsRemoteOnly((previous) =>
      typeof value === 'boolean' ? value : !previous
    );

    setCurrentPage(1);
  }, []);

  // Fetch and sanitize a single API page.
  const fetchApiPage = useCallback(
    async (page, search, signal) => {
      const url = new URL(API_BASE_URL);

      url.searchParams.set('page', String(page));

      if (search) {
        url.searchParams.set('search', search);
      }

      const response = await fetch(url.toString(), {
        signal,
      });

      if (!response.ok) {
        throw new Error(
          `Server returned HTTP ${response.status}`
        );
      }

      const payload = await response.json();

      if (signal.aborted) {
        throw new DOMException(
          'Request aborted',
          'AbortError'
        );
      }

      const rawJobs = Array.isArray(payload.data)
        ? payload.data
        : [];

      const mappedJobs = rawJobs
        .map(mapJobData)
        .filter(Boolean);

      const lastPage = Math.max(
        1,
        Number(payload.meta?.last_page) ||
          Number(payload.meta?.total_pages) ||
          1
      );

      return {
        jobs: mappedJobs,
        lastPage,
      };
    },
    []
  );

  // Fetch every API page before applying local filters.
  const fetchAllApiPages = useCallback(
    async (search, signal, isCurrentRequest) => {
      const firstPage = await fetchApiPage(
        1,
        search,
        signal
      );

      if (!isCurrentRequest()) {
        return [];
      }

      const allJobs = [...firstPage.jobs];
      const lastPage = firstPage.lastPage;

      // Fetch remaining API pages.
      for (let page = 2; page <= lastPage; page += 1) {
        if (!isCurrentRequest()) {
          return [];
        }

        const result = await fetchApiPage(
          page,
          search,
          signal
        );

        if (!isCurrentRequest()) {
          return [];
        }

        allJobs.push(...result.jobs);
      }

      return allJobs;
    },
    [fetchApiPage]
  );

  const loadJobs = useCallback(
    async (_page, search, remoteOnly) => {
      // Invalidate older requests.
      const requestId = ++requestIdRef.current;

      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const { signal } = controller;

      const isCurrentRequest = () =>
        !signal.aborted &&
        requestId === requestIdRef.current;

      setStatus('loading');
      setErrorMsg(null);

      try {
        let filteredJobs = [];
        let calculatedTotalPages = 1;

        if (remoteOnly) {
          // Fetch all API pages to filter remote jobs across the whole dataset.
          const allJobs = await fetchAllApiPages(
            search,
            signal,
            isCurrentRequest
          );

          if (!isCurrentRequest()) return;

          filteredJobs = allJobs.filter((job) => job.remote === true);
          calculatedTotalPages = Math.max(
            1,
            Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
          );
        } else {
          // Single page fetch when Remote Only filter is disabled.
          const singlePage = await fetchApiPage(
            _page,
            search,
            signal
          );

          if (!isCurrentRequest()) return;

          filteredJobs = singlePage.jobs;
          calculatedTotalPages = singlePage.lastPage;
        }

        const safeCurrentPage = Math.min(
          Math.max(1, _page),
          calculatedTotalPages
        );

        const paginatedJobs = remoteOnly
          ? filteredJobs.slice(
              (safeCurrentPage - 1) * JOBS_PER_PAGE,
              safeCurrentPage * JOBS_PER_PAGE
            )
          : filteredJobs;

        setJobs(paginatedJobs);
        setTotalPages(calculatedTotalPages);

        setStatus(
          paginatedJobs.length > 0
            ? 'success'
            : 'empty'
        );
      } catch (error) {
        if (
          error?.name === 'AbortError' ||
          !isCurrentRequest()
        ) {
          return;
        }

        setJobs([]);
        setTotalPages(1);
        setErrorMsg(
          error?.message || 'Failed to fetch jobs.'
        );
        setStatus('error');
      }
    },
    [fetchAllApiPages, fetchApiPage]
  );

  useEffect(() => {
    loadJobs(
      currentPage,
      debouncedSearch,
      isRemoteOnly
    );

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [
    currentPage,
    debouncedSearch,
    isRemoteOnly,
    loadJobs,
  ]);

  const retry = useCallback(() => {
    loadJobs(
      currentPage,
      debouncedSearch,
      isRemoteOnly
    );
  }, [
    currentPage,
    debouncedSearch,
    isRemoteOnly,
    loadJobs,
  ]);

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
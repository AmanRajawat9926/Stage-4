import { useState, useEffect, useRef, useCallback } from 'react';
import { mapJobData } from '../Utils/sanitize';

const API_BASE_URL = 'https://www.arbeitnow.com/api/job-board-api';

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

  // Cache the complete filtered result for remote mode.
  const remoteJobsCacheRef = useRef({
    key: '',
    jobs: [],
    pageSize: 1,
  });

  // --------------------------------------------------
  // Debounced search
  // --------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Remote filter
  // --------------------------------------------------

  const handleRemoteToggle = useCallback((value) => {
    setIsRemoteOnly((previous) =>
      typeof value === 'boolean' ? value : !previous
    );

    setCurrentPage(1);
  }, []);

  // --------------------------------------------------
  // Fetch one API page
  // --------------------------------------------------

  const fetchApiPage = useCallback(async (page, search, signal) => {
    const url = new URL(API_BASE_URL);

    url.searchParams.set('page', String(page));

    if (search) {
      url.searchParams.set('search', search);
    }

    const response = await fetch(url.toString(), {
      signal,
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const responseData = await response.json();

    if (signal.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }

    const rawJobs = Array.isArray(responseData.data)
      ? responseData.data
      : [];

    const mappedJobs = rawJobs
      .map(mapJobData)
      .filter(Boolean);

    const lastPage =
      Number(responseData.meta?.last_page) ||
      Number(responseData.meta?.total_pages) ||
      1;

    return {
      jobs: mappedJobs,
      lastPage,
    };
  }, []);

  // --------------------------------------------------
  // Main request
  // --------------------------------------------------

  const loadJobs = useCallback(
    async (page, search, remoteOnly) => {
      const requestId = ++requestIdRef.current;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const { signal } = controller;

      setStatus('loading');
      setErrorMsg(null);

      try {
        // ------------------------------------------------
        // Normal mode:
        // API page directly controls the visible page.
        // ------------------------------------------------

        if (!remoteOnly) {
          const result = await fetchApiPage(
            page,
            search,
            signal
          );

          if (
            signal.aborted ||
            requestId !== requestIdRef.current
          ) {
            return;
          }

          setTotalPages(result.lastPage);
          setJobs(result.jobs);

          setStatus(
            result.jobs.length > 0 ? 'success' : 'empty'
          );

          return;
        }

        // ------------------------------------------------
        // Remote-only mode:
        //
        // Arbeitnow does not provide a reliable remote-only
        // page filter. Therefore we fetch all API pages,
        // filter the complete result, and THEN paginate.
        //
        // This prevents:
        //
        // API page 1 -> 2 remote jobs
        // API page 2 -> 1 remote job
        //
        // from incorrectly treating each API page as a
        // complete remote page.
        // ------------------------------------------------

        const cacheKey = search;

        if (
          remoteJobsCacheRef.current.key !== cacheKey ||
          remoteJobsCacheRef.current.jobs.length === 0
        ) {
          const firstPage = await fetchApiPage(
            1,
            search,
            signal
          );

          if (
            signal.aborted ||
            requestId !== requestIdRef.current
          ) {
            return;
          }

          const allJobs = [...firstPage.jobs];

          const apiPageSize = Math.max(
            firstPage.jobs.length,
            1
          );

          // Fetch remaining API pages.
          for (
            let apiPage = 2;
            apiPage <= firstPage.lastPage;
            apiPage += 1
          ) {
            const nextPage = await fetchApiPage(
              apiPage,
              search,
              signal
            );

            if (
              signal.aborted ||
              requestId !== requestIdRef.current
            ) {
              return;
            }

            allJobs.push(...nextPage.jobs);
          }

          const remoteJobs = allJobs.filter(
            (job) => job.remote === true
          );

          remoteJobsCacheRef.current = {
            key: cacheKey,
            jobs: remoteJobs,
            pageSize: apiPageSize,
          };
        }

        if (
          signal.aborted ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        const {
          jobs: remoteJobs,
          pageSize,
        } = remoteJobsCacheRef.current;

        const filteredTotalPages = Math.max(
          1,
          Math.ceil(remoteJobs.length / pageSize)
        );

        const validPage = Math.min(
          Math.max(page, 1),
          filteredTotalPages
        );

        // If a filter change made the current page invalid,
        // move back to the last valid page.
        if (validPage !== page) {
          setCurrentPage(validPage);
          return;
        }

        const startIndex =
          (validPage - 1) * pageSize;

        const visibleJobs = remoteJobs.slice(
          startIndex,
          startIndex + pageSize
        );

        setTotalPages(filteredTotalPages);
        setJobs(visibleJobs);

        setStatus(
          visibleJobs.length > 0 ? 'success' : 'empty'
        );
      } catch (error) {
        if (
          error?.name === 'AbortError' ||
          signal.aborted ||
          requestId !== requestIdRef.current
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
    [fetchApiPage]
  );

  // --------------------------------------------------
  // Reset remote cache when search changes
  // --------------------------------------------------

  useEffect(() => {
    remoteJobsCacheRef.current = {
      key: '',
      jobs: [],
      pageSize: 1,
    };
  }, [debouncedSearch]);

  // --------------------------------------------------
  // Request whenever page/search/filter changes
  // --------------------------------------------------

  useEffect(() => {
    loadJobs(
      currentPage,
      debouncedSearch,
      isRemoteOnly
    );

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    currentPage,
    debouncedSearch,
    isRemoteOnly,
    loadJobs,
  ]);

  // --------------------------------------------------
  // Retry
  // --------------------------------------------------

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
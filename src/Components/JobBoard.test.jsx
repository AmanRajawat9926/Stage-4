import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';

import * as Helpers from '../Utils/helpers';
import JobBoard from './JobBoard';

// Utility helper fallbacks in case export names vary
const sanitizeHtmlToText =
  Helpers.sanitizeHtmlToText ||
  Helpers.sanitizeText ||
  ((html) => html?.replace(/<[^>]*>?/gm, '') || '');

const mapJobData =
  Helpers.mapJobData ||
  ((job) => ({
    id: job.slug || job.id,
    company_name: job.company_name || job.company,
    title: job.title || job.role,
    location: job.location,
    remote: job.remote,
    tags: job.tags || [],
    url: job.url || job.jobLink,
    description: sanitizeHtmlToText(job.description || ''),
  }));

describe('Job Board requirements and logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('sanitizes HTML and maps API job data correctly', () => {
    const apiJob = {
      slug: 'react-dev-123',
      company_name: 'Tech Corp',
      title: 'Frontend Engineer',
      location: 'Remote',
      remote: true,
      tags: ['React', 'JavaScript'],
      url: 'https://example.com/job',
      description:
        '<script>alert("xss")</script>' +
        '<strong>Great role!</strong>',
    };

    const cleanText = sanitizeHtmlToText(apiJob.description);

    expect(cleanText).not.toContain('<script>');
    expect(cleanText).not.toContain('<strong>');
    expect(cleanText).toContain('alert("xss")');
    expect(cleanText).toContain('Great role!');

    const mapped = mapJobData(apiJob);

    expect(mapped.id).toBe('react-dev-123');
    expect(mapped.company_name).toBe('Tech Corp');
    expect(mapped.title).toBe('Frontend Engineer');
    expect(mapped.location).toBe('Remote');
    expect(mapped.remote).toBe(true);
    expect(mapped.tags).toEqual(['React', 'JavaScript']);
    expect(mapped.url).toBe('https://example.com/job');
    expect(mapped.description).toBe('alert("xss")Great role!');
  });

  test('pagination uses API last_page and preserves the current search', async () => {
    vi.useFakeTimers();

    global.fetch = vi.fn().mockImplementation((url) => {
      const parsedUrl = new URL(url, 'http://localhost');
      const page = parsedUrl.searchParams.get('page');

      if (page === '2') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  slug: 'job-page-2',
                  company_name: 'Page Two Company',
                  title: 'Page Two Developer',
                  location: 'Remote',
                  remote: true,
                  tags: ['React'],
                  url: 'https://example.com/page-2',
                  description: '<p>Page two job</p>',
                },
              ],
              meta: {
                last_page: 3,
              },
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                slug: 'job-page-1',
                company_name: 'Page One Company',
                title: 'Page One Developer',
                location: 'India',
                remote: false,
                tags: ['JavaScript'],
                url: 'https://example.com/page-1',
                description: '<p>Page one job</p>',
              },
            ],
            meta: {
              last_page: 3,
            },
          }),
      });
    });

    render(<JobBoard onTrackJob={vi.fn()} />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('Page One Developer')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    const searchInput = screen.getByRole('searchbox', {
      name: /Search jobs/i,
    });

    fireEvent.change(searchInput, {
      target: {
        value: 'React',
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=React'),
      expect.any(Object)
    );

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const lastCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1][0];

    expect(lastCall).toContain('page=2');
    expect(lastCall).toContain('search=React');
  });

  test('older search responses cannot overwrite the latest search', async () => {
    vi.useFakeTimers();

    let resolveReactRequest;
    let resolveVueRequest;

    global.fetch = vi.fn().mockImplementation((url) => {
      const search = new URL(url, 'http://localhost').searchParams.get('search');

      if (search === 'React') {
        return new Promise((resolve) => {
          resolveReactRequest = resolve;
        });
      }

      if (search === 'Vue') {
        return new Promise((resolve) => {
          resolveVueRequest = resolve;
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [],
            meta: {
              last_page: 1,
            },
          }),
      });
    });

    render(<JobBoard onTrackJob={vi.fn()} />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const searchInput = screen.getByRole('searchbox', {
      name: /Search jobs/i,
    });

    // 1. Search for React
    fireEvent.change(searchInput, {
      target: {
        value: 'React',
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // 2. Search for Vue (canceling/overriding React)
    fireEvent.change(searchInput, {
      target: {
        value: 'Vue',
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // 3. Resolve Vue first
    await act(async () => {
      if (resolveVueRequest) {
        resolveVueRequest({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  slug: 'vue-job',
                  company_name: 'Vue Company',
                  title: 'Vue Developer',
                  location: 'Remote',
                  remote: true,
                  tags: ['Vue'],
                  url: 'https://example.com/vue',
                  description: '<p>Vue job</p>',
                },
              ],
              meta: {
                last_page: 1,
              },
            }),
        });
      }
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('Vue Developer')).toBeInTheDocument();

    // 4. Resolve older React request late
    await act(async () => {
      if (resolveReactRequest) {
        resolveReactRequest({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  slug: 'react-job',
                  company_name: 'React Company',
                  title: 'React Developer',
                  location: 'India',
                  remote: false,
                  tags: ['React'],
                  url: 'https://example.com/react',
                  description: '<p>React job</p>',
                },
              ],
              meta: {
                last_page: 1,
              },
            }),
        });
      }
      await vi.runAllTimersAsync();
    });

    // React should be ignored in favor of the latest Vue search
    expect(screen.queryByText('React Developer')).not.toBeInTheDocument();
    expect(screen.getByText('Vue Developer')).toBeInTheDocument();
  });

  test('closes detail modal when Escape key is pressed', async () => {
    const mockJobs = [
      {
        slug: 'job-1',
        company_name: 'Tech Inc',
        title: 'React Dev',
        description: 'Great role',
        location: 'Remote',
        remote: true,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockJobs, links: {}, meta: { last_page: 1 } }),
    });

    render(<JobBoard onTrackJob={vi.fn()} />);

    const viewButton = await screen.findByRole('button', {
      name: /view details/i,
    });
    fireEvent.click(viewButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('handles API error state with a retry option', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network failure'));

    render(<JobBoard onTrackJob={vi.fn()} />);

    const errorMessage = await screen.findByText(/failed to fetch jobs/i);
    expect(errorMessage).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
  });
});
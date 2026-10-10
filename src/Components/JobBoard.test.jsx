import React from 'react';

import {
  render,
  screen,
  fireEvent,
  act,
} from '@testing-library/react';

import '@testing-library/jest-dom';

import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';

import JobBoard from './JobBoard';
import { mapJobData } from '../Utils/sanitize';

const makeJob = ({
  slug,
  title,
  company,
  remote,
}) => ({
  slug,
  company_name: company,
  title,
  location: remote
    ? 'Remote'
    : 'India',
  remote,
  tags: ['React'],
  url: `https://example.com/${slug}`,
  description:
    '<p>Frontend Developer</p>',
});

describe('Job Board Day 5', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('mapper safely converts HTML description into plain text and neutralizes scripts', () => {
    const mapped = mapJobData({
      slug: 'safe-job',
      company_name: 'Safe Corp',
      title: 'Frontend Developer',
      location: 'Remote',
      remote: true,
      tags: ['React'],
      url: 'https://example.com/safe-job',
      description:
        '<p>Great role</p>' +
        '<script>alert("xss")</script>' +
        '<img src=x onerror="alert(1)">' +
        '<strong>React</strong>',
    });

    expect(mapped).not.toBeNull();
    expect(mapped.description).toContain('Great role');
    expect(mapped.description).toContain('React');
    expect(mapped.description).not.toContain('<script>');
    expect(mapped.description).not.toContain('<img');
    expect(mapped.description).not.toContain('onerror');
  });

  test(
    'pagination and remote-only toggle compose correctly using API-driven pages',
    async () => {
      global.fetch = vi.fn((url) => {
        const parsedUrl = new URL(url);
        const page = parsedUrl.searchParams.get('page');

        const pages = {
          '1': {
            data: [
              makeJob({
                slug: 'remote-1',
                title: 'Remote One',
                company: 'Remote Corp',
                remote: true,
              }),
              makeJob({
                slug: 'onsite-1',
                title: 'Onsite One',
                company: 'Office Corp',
                remote: false,
              }),
            ],
            meta: { last_page: 2 },
          },
        };

        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(pages[page] || pages['1']),
        });
      });

      render(
        <JobBoard
          onTrackJob={vi.fn()}
        />
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(
        screen.getByText('Remote One')
      ).toBeInTheDocument();

      const remoteCheckbox =
        screen.getByRole('checkbox', {
          name: /show remote jobs only/i,
        });

      fireEvent.click(remoteCheckbox);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(
        screen.getByText('Remote One')
      ).toBeInTheDocument();

      expect(
        screen.queryByText('Onsite One')
      ).not.toBeInTheDocument();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    }
  );

  test(
    'older search response cannot overwrite newer search result (race-safe search)',
    async () => {
      let resolveReact;
      let resolveVue;

      global.fetch = vi.fn((url) => {
        const parsedUrl = new URL(url);
        const search = parsedUrl.searchParams.get('search');

        if (search === 'React') {
          return new Promise((resolve) => {
            resolveReact = resolve;
          });
        }

        if (search === 'Vue') {
          return new Promise((resolve) => {
            resolveVue = resolve;
          });
        }

        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                makeJob({
                  slug: 'initial',
                  title: 'Initial Job',
                  company: 'Initial Corp',
                  remote: true,
                }),
              ],
              meta: { last_page: 1 },
            }),
        });
      });

      render(
        <JobBoard
          onTrackJob={vi.fn()}
        />
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const searchInput =
        screen.getByRole('searchbox', {
          name: /search jobs/i,
        });

      fireEvent.change(searchInput, {
        target: { value: 'React' },
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(resolveReact).toBeDefined();

      fireEvent.change(searchInput, {
        target: { value: 'Vue' },
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(resolveVue).toBeDefined();

      // Newer Vue request resolves first.
      await act(async () => {
        resolveVue({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                makeJob({
                  slug: 'vue-job',
                  title: 'Vue Developer',
                  company: 'Vue Corp',
                  remote: true,
                }),
              ],
              meta: { last_page: 1 },
            }),
        });

        await Promise.resolve();
      });

      expect(
        screen.getByText('Vue Developer')
      ).toBeInTheDocument();

      // Older React request resolves later.
      await act(async () => {
        resolveReact({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                makeJob({
                  slug: 'react-job',
                  title: 'React Developer',
                  company: 'React Corp',
                  remote: true,
                }),
              ],
              meta: { last_page: 1 },
            }),
        });

        await Promise.resolve();
      });

      // React must NOT overwrite the newer Vue result.
      expect(
        screen.queryByText('React Developer')
      ).not.toBeInTheDocument();

      expect(
        screen.getByText('Vue Developer')
      ).toBeInTheDocument();
    }
  );
});
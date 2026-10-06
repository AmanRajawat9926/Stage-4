import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';

import {
  sanitizeHtmlToText,
  mapJobData,
} from './Utils/sanitize';

import JobBoard from './Components/JobBoard';

describe(
  'Job Board requirements and logic',
  () => {
    afterEach(() => {
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    test(
      'sanitizes HTML and maps API job data correctly',
      () => {
        const apiJob = {
          slug: 'react-dev-123',
          company_name: 'Tech Corp',
          title: 'Frontend Engineer',
          location: 'Remote',
          remote: true,
          tags: [
            'React',
            'JavaScript',
          ],
          url: 'https://example.com/job',
          description:
            '<script>alert("xss")</script>' +
            '<strong>Great role!</strong>',
        };

        const cleanText =
          sanitizeHtmlToText(
            apiJob.description
          );

        expect(cleanText).not.toContain(
          '<script>'
        );

        expect(cleanText).not.toContain(
          '<strong>'
        );

        expect(cleanText).toContain(
          'alert("xss")'
        );

        expect(cleanText).toContain(
          'Great role!'
        );

        const mapped =
          mapJobData(apiJob);

        expect(mapped.id).toBe(
          'react-dev-123'
        );

        expect(mapped.company_name).toBe(
          'Tech Corp'
        );

        expect(mapped.title).toBe(
          'Frontend Engineer'
        );

        expect(mapped.location).toBe(
          'Remote'
        );

        expect(mapped.remote).toBe(true);

        expect(mapped.tags).toEqual([
          'React',
          'JavaScript',
        ]);

        expect(mapped.url).toBe(
          'https://example.com/job'
        );

        expect(mapped.description).toBe(
          'alert("xss")Great role!'
        );
      }
    );

    test(
      'pagination uses the API last_page value',
      async () => {
        global.fetch = jest
          .fn()
          .mockImplementation(
            (url) => {
              const page =
                new URL(url).searchParams.get(
                  'page'
                );

              if (page === '2') {
                return Promise.resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      data: [
                        {
                          slug: 'job-page-2',
                          company_name:
                            'Page Two Company',
                          title:
                            'Page Two Developer',
                          location:
                            'Remote',
                          remote: true,
                          tags: ['React'],
                          url:
                            'https://example.com/page-2',
                          description:
                            '<p>Page two job</p>',
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
                        company_name:
                          'Page One Company',
                        title:
                          'Page One Developer',
                        location:
                          'India',
                        remote: false,
                        tags: ['JavaScript'],
                        url:
                          'https://example.com/page-1',
                        description:
                          '<p>Page one job</p>',
                      },
                    ],
                    meta: {
                      last_page: 3,
                    },
                  }),
              });
            }
          );

        render(
          <JobBoard
            onTrackJob={jest.fn()}
          />
        );

        await waitFor(() => {
          expect(
            screen.getByText(
              'Page One Developer'
            )
          ).toBeInTheDocument();
        });

        expect(
          screen.getByText('Page 1 of 3')
        ).toBeInTheDocument();

        fireEvent.click(
          screen.getByRole('button', {
            name: 'Next',
          })
        );

        await waitFor(() => {
          expect(
            screen.getByText(
              'Page Two Developer'
            )
          ).toBeInTheDocument();
        });

        expect(
          screen.getByText('Page 2 of 3')
        ).toBeInTheDocument();

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(
            'page=2'
          ),
          expect.any(Object)
        );
      }
    );

    test(
      'stale search response cannot overwrite the latest search result',
      async () => {
        jest.useFakeTimers();

        let resolveReactRequest;
        let resolveVueRequest;

        global.fetch = jest
          .fn()
          .mockImplementation(
            (url) => {
              const search =
                new URL(url).searchParams.get(
                  'search'
                );

              if (search === 'React') {
                return new Promise(
                  (resolve) => {
                    resolveReactRequest =
                      resolve;
                  }
                );
              }

              if (search === 'Vue') {
                return new Promise(
                  (resolve) => {
                    resolveVueRequest =
                      resolve;
                  }
                );
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
            }
          );

        render(
          <JobBoard
            onTrackJob={jest.fn()}
          />
        );

        /*
         * Finish the initial request.
         */
        await act(async () => {
          await Promise.resolve();
        });

        const searchInput =
          screen.getByRole('searchbox', {
            name: 'Search jobs',
          });

        /*
         * Start React request.
         */
        fireEvent.change(
          searchInput,
          {
            target: {
              value: 'React',
            },
          }
        );

        await act(async () => {
          jest.advanceTimersByTime(
            300
          );

          await Promise.resolve();
        });

        expect(
          global.fetch
        ).toHaveBeenCalledWith(
          expect.stringContaining(
            'search=React'
          ),
          expect.any(Object)
        );

        /*
         * Start Vue request before React
         * request resolves.
         */
        fireEvent.change(
          searchInput,
          {
            target: {
              value: 'Vue',
            },
          }
        );

        await act(async () => {
          jest.advanceTimersByTime(
            300
          );

          await Promise.resolve();
        });

        expect(
          global.fetch
        ).toHaveBeenCalledWith(
          expect.stringContaining(
            'search=Vue'
          ),
          expect.any(Object)
        );

        /*
         * Vue responds first.
         */
        await act(async () => {
          resolveVueRequest({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [
                  {
                    slug: 'vue-job',
                    company_name:
                      'Vue Company',
                    title:
                      'Vue Developer',
                    location:
                      'Remote',
                    remote: true,
                    tags: ['Vue'],
                    url:
                      'https://example.com/vue',
                    description:
                      '<p>Vue job</p>',
                  },
                ],
                meta: {
                  last_page: 1,
                },
              }),
          });

          await Promise.resolve();
        });

        expect(
          await screen.findByText(
            'Vue Developer'
          )
        ).toBeInTheDocument();

        /*
         * React responds late.
         *
         * Because its request is stale/aborted,
         * React must not replace Vue.
         */
        await act(async () => {
          resolveReactRequest({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [
                  {
                    slug: 'react-job',
                    company_name:
                      'React Company',
                    title:
                      'React Developer',
                    location:
                      'Remote',
                    remote: true,
                    tags: ['React'],
                    url:
                      'https://example.com/react',
                    description:
                      '<p>React job</p>',
                  },
                ],
                meta: {
                  last_page: 1,
                },
              }),
          });

          await Promise.resolve();
        });

        expect(
          screen.getByText(
            'Vue Developer'
          )
        ).toBeInTheDocument();

        expect(
          screen.queryByText(
            'React Developer'
          )
        ).not.toBeInTheDocument();
      }
    );
  }
);
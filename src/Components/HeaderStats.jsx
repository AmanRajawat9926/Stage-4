import { useMemo } from 'react';
import {
  ROUNDS,
  getDerivedRound,
  countStaleApplications,
  countUpcomingInterviews,
} from '../Utils/helpers';

const DEFAULT_ROUNDS = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];

function HeaderStats({ applications = [] }) {
  const activeRounds = ROUNDS || DEFAULT_ROUNDS;

  const { counts, staleCount, upcomingInterviews } = useMemo(() => {
    const initialCounts = activeRounds.reduce((acc, round) => {
      acc[round] = 0;
      return acc;
    }, {});

    applications.forEach((app) => {
      const currentRound = app.status || (getDerivedRound ? getDerivedRound(app) : 'Applied');

      if (initialCounts[currentRound] !== undefined) {
        initialCounts[currentRound] += 1;
      }
    });

    return {
      counts: initialCounts,
      staleCount: typeof countStaleApplications === 'function' ? countStaleApplications(applications) : 0,
      upcomingInterviews: typeof countUpcomingInterviews === 'function' ? countUpcomingInterviews(applications) : 0,
    };
  }, [applications, activeRounds]);

  return (
    <section
      className="header-stats header-stats-grid"
      aria-label="Pipeline overview summary statistics"
    >
      <ul className="stats-list" role="list">
        {/* Total Tracked */}
        <li className="stat-card total">
          <span className="stat-label">Total Tracked</span>
          <span className="stat-count stat-num">{applications.length}</span>
        </li>

        {/* Dynamic Round Cards */}
        {activeRounds.map((round) => {
          const classNameSlug = round.toLowerCase().replace(/\s+/g, '-');

          return (
            <li
              key={round}
              className={`stat-card stat-${classNameSlug}`}
            >
              <span className="stat-label">{round}</span>
              <span className="stat-count stat-num">{counts[round] || 0}</span>
            </li>
          );
        })}

        {/* Stale Application Warning Counter */}
        <li className="stat-card stat-stale">
          <span className="stat-label">Stale (&gt;14d)</span>
          <span className="stat-count stat-num">{staleCount}</span>
        </li>

        {/* Upcoming Interviews Counter */}
        <li className="stat-card stat-upcoming">
          <span className="stat-label">Interviews (Next 7 Days)</span>
          <span className="stat-count stat-num">{upcomingInterviews}</span>
        </li>
      </ul>
    </section>
  );
}

export default HeaderStats;
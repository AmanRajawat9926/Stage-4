import React from 'react';

export default function ViewSwitcher({
  activeTab = 'tracker',
  setActiveTab,
  trackerCount,
  jobBoardCount,
}) {
  const tabs = [
    { id: 'tracker', label: 'My Applications', count: trackerCount },
    { id: 'job-board', label: 'External Job Board', count: jobBoardCount },
  ];

  const handleKeyDown = (e, currentId) => {
    if (!setActiveTab) return;

    const currentIndex = tabs.findIndex((tab) => tab.id === currentId);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextTab = tabs[nextIndex];
      setActiveTab(nextTab.id);

      // Shift focus to the newly selected tab
      const nextElement = document.getElementById(`tab-${nextTab.id}`);
      if (nextElement) {
        nextElement.focus();
      }
    }
  };

  return (
    <nav className="view-switcher-container" aria-label="Main Navigation">
      <div
        className="view-switcher-tabs"
        role="tablist"
        aria-label="View selection"
      >
        <button
          type="button"
          className={`tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
          onClick={() => setActiveTab?.('tracker')}
          onKeyDown={(e) => handleKeyDown(e, 'tracker')}
          aria-selected={activeTab === 'tracker'}
          tabIndex={activeTab === 'tracker' ? 0 : -1}
          role="tab"
          id="tab-tracker"
          aria-controls="panel-tracker"
        >
          <svg
            className="tab-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>My Applications</span>
          {typeof trackerCount === 'number' && (
            <span className="tab-badge">{trackerCount}</span>
          )}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'job-board' ? 'active' : ''}`}
          onClick={() => setActiveTab?.('job-board')}
          onKeyDown={(e) => handleKeyDown(e, 'job-board')}
          aria-selected={activeTab === 'job-board'}
          tabIndex={activeTab === 'job-board' ? 0 : -1}
          role="tab"
          id="tab-job-board"
          aria-controls="panel-job-board"
        >
          <svg
            className="tab-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>External Job Board</span>
          {typeof jobBoardCount === 'number' ? (
            <span className="tab-badge">{jobBoardCount}</span>
          ) : (
            <span className="tab-badge live-badge">Live</span>
          )}
        </button>
      </div>
    </nav>
  );
}
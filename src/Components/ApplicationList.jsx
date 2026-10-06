import ApplicationItem from './ApplicationItem';
import EditApplicationRow from './EditApplicationRow';

function ApplicationList({
  totalCount,
  filteredApplications,
  applications,
  editingId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onStatusChange,
  onClearFilters,
  onAddInterviewRound,
  onRemoveInterviewRound,
}) {
  // Normalize items to handle both prop variants gracefully
  const list = filteredApplications || applications || [];
  const total = totalCount !== undefined ? totalCount : list.length;

  // 1. Fully empty state
  if (total === 0) {
    return (
      <section
        className="application-list empty-state"
        aria-label="Applications list empty"
        aria-live="polite"
      >
        <div className="empty-message-box">
          <h3 className="empty-title">No applications added yet</h3>
          <p className="empty-desc">
            Your tracker is empty. Add a new application or import openings directly from the Job Board!
          </p>
        </div>
      </section>
    );
  }

  // 2. Filtered empty state (items exist in tracker, but current filter returned none)
  if (list.length === 0) {
    return (
      <section
        className="application-list empty-state"
        aria-label="No search matches"
        aria-live="polite"
      >
        <div className="empty-message-box filter-empty">
          <h3 className="empty-title">No matching applications</h3>
          <p className="empty-desc">
            No applications match your active search or status filters.
          </p>
          {onClearFilters && (
            <button
              type="button"
              className="clear-filter-btn"
              onClick={onClearFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>
    );
  }

  // 3. Render application items
  return (
    <section className="application-list" aria-label="Applications list">
      <div className="list-header">
        <h2 aria-live="polite">Applications ({list.length})</h2>
      </div>

      <ul className="application-items" role="list">
        {list.map((application) => {
          const isEditing = editingId === application.id;

          return (
            <li key={application.id} className="application-list-item">
              {isEditing ? (
                <EditApplicationRow
                  application={application}
                  onSave={onSaveEdit}
                  onCancel={onCancelEdit}
                />
              ) : (
                <ApplicationItem
                  application={application}
                  onEdit={onStartEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  onAddInterviewRound={onAddInterviewRound}
                  onRemoveInterviewRound={onRemoveInterviewRound}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ApplicationList;
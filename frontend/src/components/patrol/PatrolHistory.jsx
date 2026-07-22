const PatrolHistory = ({ history = [], onOpen, loading }) => (
  <div className="patrol-panel">
    <h3>Patrol History</h3>
    {loading && <p className="empty-hint">Loading history…</p>}
    {!loading && !history.length && (
      <p className="empty-hint">No previous patrols yet.</p>
    )}
    <div className="history-list">
      {history.map((p) => (
        <button
          key={p.routeId || p._id}
          type="button"
          className="history-item"
          onClick={() => onOpen(p)}
        >
          <div>
            <strong>{p.routeId}</strong>
            <span>
              {p.fromLocation} → {p.toLocation}
            </span>
          </div>
          <div className="history-meta">
            <span className={`badge-${p.status}`}>{p.status}</span>
            <span>{p.patrolDate ? new Date(p.patrolDate).toLocaleDateString() : ''}</span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default PatrolHistory;

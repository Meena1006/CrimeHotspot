const statusClass = (status) => {
  switch (status) {
    case 'Visited':
      return 'tl-visited';
    case 'Current':
      return 'tl-current';
    case 'Skipped':
      return 'tl-skipped';
    default:
      return 'tl-pending';
  }
};

const PatrolTimeline = ({ stops = [] }) => {
  if (!stops.length) {
    return (
      <div className="patrol-panel">
        <h3>Patrol Timeline</h3>
        <p className="empty-hint">Generate a route to see the patrol timeline.</p>
      </div>
    );
  }

  return (
    <div className="patrol-panel">
      <h3>Patrol Timeline</h3>
      <div className="patrol-timeline">
        {stops.map((stop, idx) => (
          <div key={`${stop.order}-${stop.locationName}`} className="timeline-item">
            <div className={`timeline-node ${statusClass(stop.status)}`}>
              {stop.status === 'Visited' ? '✓' : stop.role === 'start' ? '🚓' : idx + 1}
            </div>
            <div className="timeline-content">
              <strong>{stop.role === 'start' ? `Station · ${stop.locationName}` : stop.locationName}</strong>
              <span className={`tl-status ${statusClass(stop.status)}`}>{stop.status}</span>
              <span className="tl-risk">{stop.riskLevel}</span>
            </div>
            {idx < stops.length - 1 && <div className="timeline-connector" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatrolTimeline;

const LiveStats = ({ patrol }) => {
  if (!patrol) {
    return (
      <div className="patrol-stats-grid">
        {['Estimated Distance', 'Estimated Duration', 'Total Stops', 'Visited', 'Remaining', 'Risk Coverage'].map(
          (label) => (
            <div key={label} className="patrol-stat-card muted">
              <span className="stat-label">{label}</span>
              <span className="stat-value">—</span>
            </div>
          )
        )}
      </div>
    );
  }

  const visited = patrol.stops?.filter((s) => s.status === 'Visited').length || 0;
  const total = patrol.stops?.length || 0;
  const remaining = total - visited;

  const cards = [
    { label: 'Estimated Distance', value: `${patrol.estimatedDistance ?? 0} km` },
    { label: 'Estimated Duration', value: `${patrol.estimatedTime ?? 0} min` },
    { label: 'Total Stops', value: total },
    { label: 'Visited', value: visited },
    { label: 'Remaining', value: remaining },
    { label: 'Risk Coverage', value: `${patrol.riskCoverage ?? 0}%` },
  ];

  return (
    <div className="patrol-stats-grid">
      {cards.map((c) => (
        <div key={c.label} className="patrol-stat-card">
          <span className="stat-label">{c.label}</span>
          <span className="stat-value">{c.value}</span>
        </div>
      ))}
    </div>
  );
};

export default LiveStats;

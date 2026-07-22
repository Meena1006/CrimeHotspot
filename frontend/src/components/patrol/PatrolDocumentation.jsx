const PatrolDocumentation = ({ patrol }) => {
  if (!patrol) {
    return (
      <div className="patrol-panel">
        <h3>Patrol Documentation</h3>
        <p className="empty-hint">Lock a patrol to create permanent documentation.</p>
      </div>
    );
  }

  const visited = patrol.stops?.filter((s) => s.status === 'Visited').length || 0;
  const pending = patrol.stops?.filter((s) => s.status !== 'Visited').length || 0;

  const fields = [
    { label: 'Officer Name', value: patrol.officerName },
    { label: 'Officer ID', value: patrol.officerId },
    { label: 'Date', value: patrol.patrolDate ? new Date(patrol.patrolDate).toLocaleDateString() : '—' },
    { label: 'Shift', value: patrol.shift },
    { label: 'Route ID', value: patrol.routeId },
    { label: 'Start Location', value: patrol.fromLocation },
    { label: 'Destination', value: patrol.toLocation },
    { label: 'Total Distance', value: `${patrol.estimatedDistance} km` },
    { label: 'Estimated Time', value: `${patrol.estimatedTime} min` },
    { label: 'Actual Time', value: patrol.actualTime != null ? `${patrol.actualTime} min` : 'In progress' },
    { label: 'Intermediate Stops', value: patrol.hotspotsCovered ?? 0 },
    { label: 'Visited Stops', value: visited },
    { label: 'Pending Stops', value: pending },
    { label: 'Risk Coverage', value: `${patrol.riskCoverage ?? 0}%` },
    { label: 'Priority Mode', value: patrol.priorityMode },
    {
      label: 'Generated At',
      value: patrol.generatedAt
        ? new Date(patrol.generatedAt).toLocaleString()
        : '—',
    },
    {
      label: 'Locked At',
      value: patrol.lockedAt ? new Date(patrol.lockedAt).toLocaleString() : 'Not locked',
    },
  ];

  return (
    <div className="patrol-panel">
      <div className="patrol-panel-header">
        <h3>Patrol Documentation</h3>
        {patrol.status === 'active' && <span className="badge-active">ACTIVE</span>}
        {patrol.status === 'completed' && <span className="badge-completed">COMPLETED</span>}
      </div>
      <div className="doc-grid">
        {fields.map((f) => (
          <div key={f.label} className="doc-field">
            <span>{f.label}</span>
            <strong>{f.value}</strong>
          </div>
        ))}
      </div>

      {patrol.status === 'completed' && (
        <div className="final-summary">
          <h4>Final Summary</h4>
          <p>
            Officer <strong>{patrol.officerName}</strong> completed patrol{' '}
            <strong>{patrol.routeId}</strong> covering {patrol.estimatedDistance} km
            with {visited} visited locations and {patrol.riskCoverage}% risk coverage.
          </p>
        </div>
      )}
    </div>
  );
};

export default PatrolDocumentation;

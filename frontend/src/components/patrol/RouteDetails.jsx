const RouteDetails = ({ patrol }) => {
  if (!patrol) {
    return (
      <div className="patrol-panel">
        <h3>Route Details</h3>
        <p className="empty-hint">Route metrics appear after generation.</p>
      </div>
    );
  }

  const items = [
    { label: 'Total Distance', value: `${patrol.estimatedDistance} km` },
    { label: 'Estimated Patrol Time', value: `${patrol.estimatedTime} min` },
    { label: 'Hotspots Covered', value: patrol.hotspotsCovered ?? 0 },
    { label: 'Highest Risk Area', value: patrol.highestRiskArea || 'N/A' },
    { label: 'Average Risk', value: patrol.averageRisk ?? 0 },
    { label: 'Coverage', value: `${patrol.coveragePercentage ?? 0}%` },
    { label: 'Algorithm', value: patrol.algorithm || 'A*' },
    { label: 'Route ID', value: patrol.routeId },
  ];

  return (
    <div className="patrol-panel">
      <h3>Route Details</h3>
      <div className="route-details-grid">
        {items.map((item) => (
          <div key={item.label} className="route-detail-item">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouteDetails;

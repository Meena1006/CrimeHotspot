const IntermediateStopTable = ({ stops = [], locked, onGuard, guardingOrder }) => {
  const rows = stops.filter((s) => s.role === 'intermediate' || s.role === 'destination');

  if (!rows.length) {
    return (
      <div className="patrol-panel">
        <h3>Intermediate Stops</h3>
        <p className="empty-hint">Stops will appear after route generation.</p>
      </div>
    );
  }

  return (
    <div className="patrol-panel">
      <h3>Intermediate Stops</h3>
      <div className="table-scroll">
        <table className="patrol-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Location</th>
              <th>Risk</th>
              <th>Arrival</th>
              <th>Departure</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((stop) => (
              <tr key={stop.order} className={stop.status === 'Visited' ? 'row-visited' : ''}>
                <td>{stop.order}</td>
                <td>{stop.locationName}</td>
                <td>
                  <span className={`risk-badge risk-${(stop.riskLevel || 'Low').toLowerCase()}`}>
                    {stop.riskLevel}
                  </span>
                </td>
                <td>{stop.arrivalTime || '—'}</td>
                <td>{stop.departureTime || '—'}</td>
                <td>{stop.status}</td>
                <td>
                  {stop.guardedAt
                    ? new Date(stop.guardedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </td>
                <td>
                  {locked && stop.status !== 'Visited' ? (
                    <button
                      type="button"
                      className="btn-guarded"
                      disabled={guardingOrder === stop.order}
                      onClick={() => onGuard(stop.order)}
                    >
                      {guardingOrder === stop.order ? '…' : 'Guarded'}
                    </button>
                  ) : stop.status === 'Visited' ? (
                    <button type="button" className="btn-guarded guarded-done" disabled>
                      Guarded ✓
                    </button>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IntermediateStopTable;

const ProgressCard = ({ patrol }) => {
  if (!patrol?.stops?.length) return null;

  const visited = patrol.stops.filter((s) => s.status === 'Visited').length;
  const total = patrol.stops.length;
  const remaining = total - visited;
  const percent = Math.round((visited / total) * 100);

  return (
    <div className="patrol-progress-card">
      <div className="progress-header">
        <h3>Patrol Completion</h3>
        <span className="progress-percent">{percent}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-meta">
        <span>Visited {visited} / {total}</span>
        <span>Remaining {remaining}</span>
      </div>
      {patrol.status === 'completed' && (
        <div className="patrol-complete-banner">PATROL COMPLETED</div>
      )}
    </div>
  );
};

export default ProgressCard;

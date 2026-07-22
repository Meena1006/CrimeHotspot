const FeasibilityWarning = ({ warning, onClose }) => {
  if (!warning) return null;

  return (
    <div className="patrol-modal-overlay" role="dialog" aria-modal="true">
      <div className="patrol-modal warning-modal">
        <div className="warning-icon">⚠</div>
        <h2>{warning.title || 'Patrol Not Feasible'}</h2>
        <p>{warning.message}</p>
        <div className="warning-stats">
          <div>
            <span>Estimated travel time</span>
            <strong>{warning.estimatedTravelTime} Minutes</strong>
          </div>
          <div>
            <span>Maximum selected</span>
            <strong>{warning.maximumSelected} Minutes</strong>
          </div>
        </div>
        {warning.suggestions?.length > 0 && (
          <div className="warning-suggestions">
            <p>Suggestions</p>
            <ul>
              {warning.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="warning-note">Route was not generated.</p>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Understood
        </button>
      </div>
    </div>
  );
};

export default FeasibilityWarning;

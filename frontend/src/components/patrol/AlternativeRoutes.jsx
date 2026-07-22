const AlternativeRoutes = ({ alternatives = [], selectedIndex, onSelect }) => {
  if (!alternatives.length) return null;

  return (
    <div className="patrol-panel">
      <h3>Compare Alternative Routes</h3>
      <div className="alt-routes-grid">
        {alternatives.map((alt, idx) => (
          <button
            key={alt.label || idx}
            type="button"
            className={`alt-route-card ${selectedIndex === idx ? 'selected' : ''}`}
            onClick={() => onSelect(idx)}
          >
            <strong>{alt.label || `Alternative ${idx + 1}`}</strong>
            <span>Distance: {alt.estimatedDistance} km</span>
            <span>ETA: {alt.estimatedTime} min</span>
            <span>Coverage: {alt.coveragePercentage}%</span>
            <span>Risk: {alt.riskCoverage}%</span>
            <span>Hotspots: {alt.hotspotsCovered}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AlternativeRoutes;

const StatCard = ({ title, value, icon, accent }) => {
  return (
    <div className={`stat-card stat-card-${accent}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;

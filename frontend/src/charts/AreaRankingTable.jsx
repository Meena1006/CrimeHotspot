const AreaRankingTable = ({ data = [] }) => {
  if (!data.length) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <div className="ranking-table-wrapper">
      <table className="ranking-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Area</th>
            <th>Crime Count</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.area}>
              <td>
                <span className={`rank-badge rank-${row.rank <= 3 ? row.rank : 'other'}`}>
                  #{row.rank}
                </span>
              </td>
              <td>{row.area}</td>
              <td>{row.count}</td>
              <td>
                <span
                  className={`status-badge ${
                    row.count > 30 ? 'critical' : row.count > 15 ? 'high' : row.count > 5 ? 'medium' : 'low'
                  }`}
                >
                  {row.count > 30 ? 'Critical' : row.count > 15 ? 'High' : row.count > 5 ? 'Medium' : 'Low'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AreaRankingTable;

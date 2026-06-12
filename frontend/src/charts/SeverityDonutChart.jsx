import { Doughnut } from 'react-chartjs-2';
import { chartDefaults } from './chartConfig';

const severityColors = {
  Low: '#22c55e',
  Medium: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
};

const SeverityDonutChart = ({ data = [] }) => {
  const chartData = {
    labels: data.map((d) => d.severity),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: data.map((d) => severityColors[d.severity] || '#64748b'),
        borderColor: '#1e293b',
        borderWidth: 2,
        cutout: '60%',
      },
    ],
  };

  const options = {
    ...chartDefaults,
    plugins: {
      ...chartDefaults.plugins,
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', padding: 16 },
      },
    },
  };

  if (!data.length) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <div className="chart-wrapper">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default SeverityDonutChart;

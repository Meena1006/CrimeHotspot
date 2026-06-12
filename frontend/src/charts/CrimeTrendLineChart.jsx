import { Line } from 'react-chartjs-2';
import { chartDefaults } from './chartConfig';

const CrimeTrendLineChart = ({ data = [] }) => {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Crimes',
        data: data.map((d) => d.count),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 3,
      },
    ],
  };

  const options = {
    ...chartDefaults,
    plugins: {
      ...chartDefaults.plugins,
      legend: { display: false },
    },
  };

  if (!data.length) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <div className="chart-wrapper">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default CrimeTrendLineChart;

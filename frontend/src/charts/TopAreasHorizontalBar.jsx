import { Bar } from 'react-chartjs-2';
import { chartDefaults } from './chartConfig';

const TopAreasHorizontalBar = ({ data = [] }) => {
  const chartData = {
    labels: data.map((d) => d.area),
    datasets: [
      {
        label: 'Crime Count',
        data: data.map((d) => d.count),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    ...chartDefaults,
    indexAxis: 'y',
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
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default TopAreasHorizontalBar;

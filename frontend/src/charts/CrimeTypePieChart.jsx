import { Pie } from 'react-chartjs-2';
import { chartDefaults, chartColors } from './chartConfig';

const CrimeTypePieChart = ({ data = [] }) => {
  const chartData = {
    labels: data.map((d) => d.type),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: chartColors,
        borderColor: '#1e293b',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...chartDefaults,
    plugins: {
      ...chartDefaults.plugins,
      legend: {
        position: 'right',
        labels: { color: '#94a3b8', padding: 12 },
      },
    },
  };

  if (!data.length) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <div className="chart-wrapper">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default CrimeTypePieChart;

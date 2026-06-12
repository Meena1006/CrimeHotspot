import { Bar } from 'react-chartjs-2';
import { chartDefaults, chartColors } from './chartConfig';

const AreaBarChart = ({ data = [] }) => {
  const chartData = {
    labels: data.map((d) => d.area),
    datasets: [
      {
        label: 'Crime Count',
        data: data.map((d) => d.count),
        backgroundColor: chartColors.map((c) => c + '99'),
        borderColor: chartColors,
        borderWidth: 1,
        borderRadius: 4,
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
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default AreaBarChart;

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#94a3b8' },
    },
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
    },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
    },
  },
};

export const chartColors = [
  '#3b82f6',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#8b5cf6',
  '#ec4899',
];

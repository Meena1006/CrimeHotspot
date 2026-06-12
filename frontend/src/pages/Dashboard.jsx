import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FilterPanel, { defaultFilters } from '../components/FilterPanel';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import useDashboardData from '../hooks/useDashboardData';
import CrimeMap from '../map/CrimeMap';
import AreaBarChart from '../charts/AreaBarChart';
import CrimeTypePieChart from '../charts/CrimeTypePieChart';
import CrimeTrendLineChart from '../charts/CrimeTrendLineChart';
import TopAreasHorizontalBar from '../charts/TopAreasHorizontalBar';
import SeverityDonutChart from '../charts/SeverityDonutChart';
import AreaRankingTable from '../charts/AreaRankingTable';

const Dashboard = () => {
  const location = useLocation();
  const [filters, setFilters] = useState(defaultFilters);
  const { analytics, hotspots, crimes, loading, error, refresh } = useDashboardData(filters);

  useEffect(() => {
    if (location.state?.refresh) {
      refresh();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refresh]);

  const handleApply = (newFilters) => setFilters(newFilters);
  const handleReset = () => setFilters(defaultFilters);

  const { cards, charts } = analytics;

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1>Crime Analytics Dashboard</h1>
          <p>Chennai Crime Hotspot Monitoring System</p>
        </div>
      </header>

      <FilterPanel filters={filters} onApply={handleApply} onReset={handleReset} />

      {loading ? (
        <div className="dashboard-loading">
          <LoadingSpinner size="large" />
          <p>Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              title="Total Crimes"
              value={cards.totalCrimes}
              icon="📋"
              accent="blue"
            />
            <StatCard
              title="Most Dangerous Area"
              value={cards.mostDangerousArea}
              icon="⚠️"
              accent="red"
            />
            <StatCard
              title="Most Frequent Crime"
              value={cards.mostFrequentCrime}
              icon="🔍"
              accent="orange"
            />
            <StatCard
              title="Today's Crime Count"
              value={cards.todayCrimeCount}
              icon="📅"
              accent="green"
            />
          </div>

          <div className="map-section">
            <h2>Crime Hotspot Map</h2>
            <CrimeMap hotspots={hotspots} crimes={crimes} />
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Area vs Crime Count</h3>
              <AreaBarChart data={charts.areaVsCount} />
            </div>
            <div className="chart-card">
              <h3>Crime Type Distribution</h3>
              <CrimeTypePieChart data={charts.crimeTypeDistribution} />
            </div>
            <div className="chart-card chart-wide">
              <h3>Crime Trend Over Time</h3>
              <CrimeTrendLineChart data={charts.crimeTrend} />
            </div>
            <div className="chart-card">
              <h3>Top Dangerous Areas</h3>
              <TopAreasHorizontalBar data={charts.topDangerousAreas} />
            </div>
            <div className="chart-card">
              <h3>Severity Distribution</h3>
              <SeverityDonutChart data={charts.severityDistribution} />
            </div>
            <div className="chart-card chart-wide">
              <h3>Top 10 Crime Areas Ranking</h3>
              <AreaRankingTable data={charts.areaRanking} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

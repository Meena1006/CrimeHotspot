import { useState, useEffect, useCallback } from 'react';
import { crimeService } from '../services/crimeService';

const defaultAnalytics = {
  cards: {
    totalCrimes: 0,
    mostDangerousArea: 'N/A',
    mostFrequentCrime: 'N/A',
    todayCrimeCount: 0,
  },
  charts: {
    areaVsCount: [],
    crimeTypeDistribution: [],
    crimeTrend: [],
    topDangerousAreas: [],
    severityDistribution: [],
    areaRanking: [],
  },
};

export const useDashboardData = (filters) => {
  const [analytics, setAnalytics] = useState(defaultAnalytics);
  const [hotspots, setHotspots] = useState([]);
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const [analyticsRes, hotspotsRes, crimesRes] = await Promise.all([
        crimeService.getAnalytics(params),
        crimeService.getHotspots(params),
        crimeService.getFilteredCrimes(params),
      ]);

      setAnalytics(analyticsRes.data.data);
      setHotspots(hotspotsRes.data.data);
      setCrimes(crimesRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = () => setRefreshKey((k) => k + 1);

  return { analytics, hotspots, crimes, loading, error, refresh };
};

export default useDashboardData;

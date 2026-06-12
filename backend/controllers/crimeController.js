const Crime = require('../models/Crime');

const buildFilterQuery = (query) => {
  const filter = {};

  if (query.crimeType) filter.crimeType = query.crimeType;
  if (query.location) filter.locationName = new RegExp(query.location, 'i');
  if (query.severity) filter.severity = query.severity;

  if (query.dateFrom || query.dateTo) {
    filter.crimeDate = {};
    if (query.dateFrom) filter.crimeDate.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const endDate = new Date(query.dateTo);
      endDate.setHours(23, 59, 59, 999);
      filter.crimeDate.$lte = endDate;
    }
  }

  if (query.timeFrom || query.timeTo) {
    filter.crimeTime = {};
    if (query.timeFrom) filter.crimeTime.$gte = query.timeFrom;
    if (query.timeTo) filter.crimeTime.$lte = query.timeTo;
  }

  return filter;
};

const getSeverityScore = (severity) => {
  const scores = { Low: 1, Medium: 2, High: 3, Critical: 4 };
  return scores[severity] || 1;
};

const getPeakTime = (times) => {
  if (!times.length) return 'N/A';
  const hourCounts = {};
  times.forEach((time) => {
    const hour = parseInt(time.split(':')[0], 10);
    const slot = `${String(hour).padStart(2, '0')}:00-${String(hour + 1).padStart(2, '0')}:00`;
    hourCounts[slot] = (hourCounts[slot] || 0) + 1;
  });
  return Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0];
};

const getTopCrime = (types) => {
  if (!types.length) return 'N/A';
  const counts = {};
  types.forEach((t) => {
    counts[t] = (counts[t] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

exports.addCrime = async (req, res) => {
  try {
    const crime = await Crime.create(req.body);
    res.status(201).json({ success: true, message: 'Crime report added', data: crime });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCrimes = async (req, res) => {
  try {
    const crimes = await Crime.find().sort({ crimeDate: -1 });
    res.status(200).json({ success: true, count: crimes.length, data: crimes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFilteredCrimes = async (req, res) => {
  try {
    const filter = buildFilterQuery(req.query);
    const crimes = await Crime.find(filter).sort({ crimeDate: -1 });
    res.status(200).json({ success: true, count: crimes.length, data: crimes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHotspots = async (req, res) => {
  try {
    const filter = buildFilterQuery(req.query);
    const crimes = await Crime.find(filter);

    const locationMap = {};

    crimes.forEach((crime) => {
      const key = crime.locationName;
      if (!locationMap[key]) {
        locationMap[key] = {
          area: key,
          lat: crime.latitude,
          lng: crime.longitude,
          count: 0,
          severities: [],
          times: [],
          types: [],
        };
      }
      locationMap[key].count += 1;
      locationMap[key].severities.push(getSeverityScore(crime.severity));
      locationMap[key].times.push(crime.crimeTime);
      locationMap[key].types.push(crime.crimeType);
      locationMap[key].lat = crime.latitude;
      locationMap[key].lng = crime.longitude;
    });

    const hotspots = Object.values(locationMap).map((loc) => {
      const avgSeverity =
        loc.severities.reduce((a, b) => a + b, 0) / loc.severities.length;
      const intensity = loc.count * avgSeverity;

      return {
        area: loc.area,
        lat: loc.lat,
        lng: loc.lng,
        count: loc.count,
        topCrime: getTopCrime(loc.types),
        peakTime: getPeakTime(loc.times),
        avgSeverity: avgSeverity.toFixed(2),
        intensity: Math.round(intensity),
      };
    });

    hotspots.sort((a, b) => b.count - a.count);

    res.status(200).json({ success: true, count: hotspots.length, data: hotspots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const filter = buildFilterQuery(req.query);
    const crimes = await Crime.find(filter);

    const totalCrimes = crimes.length;

    const locationCounts = {};
    const typeCounts = {};
    const severityCounts = {};
    const dateCounts = {};

    crimes.forEach((crime) => {
      locationCounts[crime.locationName] = (locationCounts[crime.locationName] || 0) + 1;
      typeCounts[crime.crimeType] = (typeCounts[crime.crimeType] || 0) + 1;
      severityCounts[crime.severity] = (severityCounts[crime.severity] || 0) + 1;

      const dateKey = new Date(crime.crimeDate).toISOString().split('T')[0];
      dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
    });

    const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
    const mostDangerousArea = sortedLocations.length ? sortedLocations[0][0] : 'N/A';

    const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    const mostFrequentCrime = sortedTypes.length ? sortedTypes[0][0] : 'N/A';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCrimeCount = crimes.filter((c) => {
      const d = new Date(c.crimeDate);
      return d >= today && d < tomorrow;
    }).length;

    const areaVsCount = sortedLocations.map(([area, count]) => ({ area, count }));
    const crimeTypeDistribution = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
    const crimeTrend = Object.entries(dateCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
    const topDangerousAreas = sortedLocations.slice(0, 10).map(([area, count]) => ({ area, count }));
    const severityDistribution = Object.entries(severityCounts).map(([severity, count]) => ({
      severity,
      count,
    }));
    const areaRanking = sortedLocations.slice(0, 10).map(([area, count], index) => ({
      rank: index + 1,
      area,
      count,
    }));

    res.status(200).json({
      success: true,
      data: {
        cards: {
          totalCrimes,
          mostDangerousArea,
          mostFrequentCrime,
          todayCrimeCount,
        },
        charts: {
          areaVsCount,
          crimeTypeDistribution,
          crimeTrend,
          topDangerousAreas,
          severityDistribution,
          areaRanking,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

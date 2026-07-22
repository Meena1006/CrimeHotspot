/**
 * Free OSRM public routing API (no API key).
 * https://router.project-osrm.org
 */
const https = require('https');

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

const httpsGetJson = (url, timeoutMs = 12000) =>
  new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OSRM request timed out'));
    });
  });

/**
 * @param {Array<{lat:number,lng:number}>} waypoints
 */
const getRoute = async (waypoints) => {
  if (!waypoints || waypoints.length < 2) return null;

  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&steps=true`;

  try {
    const data = await httpsGetJson(url);
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route = data.routes[0];
    const geometry = (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]);

    return {
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      geometry,
      legs: (route.legs || []).map((leg) => ({
        distanceKm: leg.distance / 1000,
        durationMin: leg.duration / 60,
        steps: (leg.steps || []).map((s) => ({
          instruction: s.maneuver?.instruction || s.name || '',
          distanceKm: s.distance / 1000,
          durationMin: s.duration / 60,
        })),
      })),
    };
  } catch (err) {
    console.warn('OSRM request failed, using haversine fallback:', err.message);
    return null;
  }
};

const estimateRoute = (waypoints, haversineKm) => {
  let distanceKm = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    distanceKm += haversineKm(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    );
  }
  distanceKm *= 1.35;
  const durationMin = (distanceKm / 22) * 60;
  const geometry = waypoints.map((w) => [w.lat, w.lng]);

  return {
    distanceKm,
    durationMin,
    geometry,
    legs: [],
    fallback: true,
  };
};

module.exports = { getRoute, estimateRoute, OSRM_BASE };

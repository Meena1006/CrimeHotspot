/**
 * DBSCAN clustering for geospatial crime points.
 * eps is in degrees (~0.008 ≈ 900m at Chennai latitude).
 */
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const regionQuery = (points, index, epsKm) => {
  const neighbors = [];
  const p = points[index];
  for (let i = 0; i < points.length; i++) {
    if (haversineKm(p.lat, p.lng, points[i].lat, points[i].lng) <= epsKm) {
      neighbors.push(i);
    }
  }
  return neighbors;
};

/**
 * @param {Array<{lat:number,lng:number}>} points
 * @param {number} epsKm neighborhood radius in km
 * @param {number} minPts minimum points to form a cluster
 * @returns {Array<{clusterId:number, points:Array, centroid:{lat,lng}}>}
 */
const dbscan = (points, epsKm = 1.2, minPts = 3) => {
  const labels = new Array(points.length).fill(-1); // -1 unvisited, -2 noise
  let clusterId = 0;

  for (let i = 0; i < points.length; i++) {
    if (labels[i] !== -1) continue;

    const neighbors = regionQuery(points, i, epsKm);
    if (neighbors.length < minPts) {
      labels[i] = -2;
      continue;
    }

    labels[i] = clusterId;
    const seedSet = [...neighbors];

    for (let s = 0; s < seedSet.length; s++) {
      const q = seedSet[s];
      if (labels[q] === -2) labels[q] = clusterId;
      if (labels[q] !== -1) continue;

      labels[q] = clusterId;
      const qNeighbors = regionQuery(points, q, epsKm);
      if (qNeighbors.length >= minPts) {
        for (const n of qNeighbors) {
          if (!seedSet.includes(n)) seedSet.push(n);
        }
      }
    }

    clusterId += 1;
  }

  const clusters = [];
  for (let c = 0; c < clusterId; c++) {
    const members = points.filter((_, idx) => labels[idx] === c);
    if (!members.length) continue;
    const centroid = {
      lat: members.reduce((s, p) => s + p.lat, 0) / members.length,
      lng: members.reduce((s, p) => s + p.lng, 0) / members.length,
    };
    clusters.push({ clusterId: c, points: members, centroid });
  }

  return clusters;
};

module.exports = { dbscan, haversineKm };

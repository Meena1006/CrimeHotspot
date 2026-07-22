const { haversineKm } = require('./dbscan');

/**
 * Priority-mode edge cost.
 * Lower cost = more preferred.
 */
const edgeCost = (distanceKm, riskScore, priorityMode) => {
  const risk = Math.max(riskScore, 0.1);
  switch (priorityMode) {
    case 'Highest Risk Areas':
      // Prefer high-risk edges (inverse risk + small distance)
      return distanceKm * 0.3 + 10 / risk;
    case 'Maximum Coverage':
      return distanceKm * 0.5 + 5 / risk;
    case 'Balanced':
      return distanceKm * 0.7 + 4 / risk;
    case 'Shortest Route':
    default:
      return distanceKm;
  }
};

/**
 * Dijkstra shortest path on weighted graph.
 * @returns {{path: string[], cost: number}|null}
 */
const dijkstra = (graph, startId, endId) => {
  const dist = {};
  const prev = {};
  const visited = new Set();
  const nodes = Object.keys(graph);

  nodes.forEach((n) => {
    dist[n] = Infinity;
    prev[n] = null;
  });
  dist[startId] = 0;

  while (visited.size < nodes.length) {
    let u = null;
    let best = Infinity;
    for (const n of nodes) {
      if (!visited.has(n) && dist[n] < best) {
        best = dist[n];
        u = n;
      }
    }
    if (u === null || best === Infinity) break;
    if (u === endId) break;
    visited.add(u);

    for (const edge of graph[u] || []) {
      const alt = dist[u] + edge.cost;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = u;
      }
    }
  }

  if (dist[endId] === Infinity) return null;

  const path = [];
  let cur = endId;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return { path, cost: dist[endId] };
};

/**
 * A* pathfinding with haversine heuristic.
 */
const aStar = (graph, nodesMap, startId, endId, priorityMode) => {
  const goal = nodesMap[endId];
  if (!goal) return dijkstra(graph, startId, endId);

  const gScore = {};
  const fScore = {};
  const prev = {};
  const open = new Set([startId]);
  const closed = new Set();

  Object.keys(graph).forEach((n) => {
    gScore[n] = Infinity;
    fScore[n] = Infinity;
    prev[n] = null;
  });
  gScore[startId] = 0;

  const heuristic = (id) => {
    const n = nodesMap[id];
    if (!n) return 0;
    const d = haversineKm(n.lat, n.lng, goal.lat, goal.lng);
    // Heuristic must be admissible; use distance-only estimate
    return priorityMode === 'Shortest Route' ? d : d * 0.5;
  };

  fScore[startId] = heuristic(startId);

  while (open.size) {
    let current = null;
    let bestF = Infinity;
    for (const id of open) {
      if (fScore[id] < bestF) {
        bestF = fScore[id];
        current = id;
      }
    }
    if (current === null) break;
    if (current === endId) {
      const path = [];
      let cur = endId;
      while (cur) {
        path.unshift(cur);
        cur = prev[cur];
      }
      return { path, cost: gScore[endId], algorithm: 'A*' };
    }

    open.delete(current);
    closed.add(current);

    for (const edge of graph[current] || []) {
      if (closed.has(edge.to)) continue;
      const tentative = gScore[current] + edge.cost;
      if (!open.has(edge.to)) open.add(edge.to);
      if (tentative >= gScore[edge.to]) continue;
      prev[edge.to] = current;
      gScore[edge.to] = tentative;
      fScore[edge.to] = tentative + heuristic(edge.to);
    }
  }

  // Fallback to Dijkstra
  const fallback = dijkstra(graph, startId, endId);
  if (fallback) return { ...fallback, algorithm: 'Dijkstra' };
  return null;
};

/**
 * Yen's k-shortest paths (simplified) for alternative routes.
 * Avoids previously used intermediate nodes when possible.
 */
const kShortestPaths = (graph, nodesMap, startId, endId, priorityMode, k = 3, avoidPaths = []) => {
  const results = [];
  const primary = aStar(graph, nodesMap, startId, endId, priorityMode);
  if (primary) results.push(primary);

  const avoidedNodeSets = avoidPaths.map((p) => new Set(p.slice(1, -1)));

  // Generate alternatives by temporarily removing intermediate nodes from prior paths
  const candidates = [];
  for (const used of results) {
    const intermediates = used.path.slice(1, -1);
    for (const removeId of intermediates) {
      const modified = {};
      for (const [from, edges] of Object.entries(graph)) {
        if (from === removeId) continue;
        modified[from] = edges.filter((e) => e.to !== removeId);
      }
      // Ensure start/end remain
      if (!modified[startId]) modified[startId] = graph[startId] || [];
      if (!modified[endId]) modified[endId] = graph[endId] || [];

      const alt = aStar(modified, nodesMap, startId, endId, priorityMode);
      if (!alt) continue;

      const key = alt.path.join('>');
      if (candidates.some((c) => c.path.join('>') === key)) continue;
      if (results.some((r) => r.path.join('>') === key)) continue;
      candidates.push(alt);
    }
  }

  // Also try boosting coverage: force high-risk waypoints
  const highRiskIds = Object.values(nodesMap)
    .filter((n) => n.type === 'hotspot' && n.riskLevel === 'High' && n.id !== startId && n.id !== endId)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)
    .map((n) => n.id);

  for (const via of highRiskIds) {
    if (results[0]?.path.includes(via)) continue;
    const leg1 = aStar(graph, nodesMap, startId, via, priorityMode);
    const leg2 = aStar(graph, nodesMap, via, endId, priorityMode);
    if (!leg1 || !leg2) continue;
    const path = [...leg1.path, ...leg2.path.slice(1)];
    const cost = leg1.cost + leg2.cost;
    const key = path.join('>');
    if (results.some((r) => r.path.join('>') === key)) continue;
    if (candidates.some((c) => c.path.join('>') === key)) continue;
    candidates.push({ path, cost, algorithm: 'A*-via' });
  }

  candidates.sort((a, b) => a.cost - b.cost);
  for (const c of candidates) {
    if (results.length >= k) break;
    // Prefer paths that differ from avoided sets
    const mid = new Set(c.path.slice(1, -1));
    const tooSimilar = avoidedNodeSets.some((avoided) => {
      if (!avoided.size) return false;
      let overlap = 0;
      for (const n of mid) if (avoided.has(n)) overlap += 1;
      return overlap / avoided.size > 0.8;
    });
    if (tooSimilar && results.length > 0) continue;
    results.push(c);
  }

  return results.slice(0, k);
};

/**
 * Build complete graph from hotspot nodes.
 */
const buildGraph = (nodes, priorityMode) => {
  const graph = {};
  const nodesMap = {};

  nodes.forEach((n) => {
    nodesMap[n.id] = n;
    graph[n.id] = [];
  });

  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const a = nodes[i];
      const b = nodes[j];
      const dist = haversineKm(a.lat, a.lng, b.lat, b.lng);
      // Connect nodes within reasonable Chennai patrol radius
      if (dist > 25) continue;
      const riskWeight = (a.riskScore + b.riskScore) / 2;
      graph[a.id].push({
        to: b.id,
        distanceKm: dist,
        estimatedMinutes: (dist / 25) * 60, // ~25 km/h urban
        riskWeight,
        cost: edgeCost(dist, riskWeight, priorityMode),
      });
    }
  }

  return { graph, nodesMap };
};

/**
 * Insert high-risk intermediate stops for coverage modes.
 */
const enrichPathWithHotspots = (path, nodesMap, priorityMode, maxStops = 6) => {
  if (priorityMode === 'Shortest Route') return path;

  const start = path[0];
  const end = path[path.length - 1];
  const existing = new Set(path);

  const candidates = Object.values(nodesMap)
    .filter((n) => n.type === 'hotspot' && !existing.has(n.id))
    .sort((a, b) => b.riskScore - a.riskScore);

  if (priorityMode === 'Highest Risk Areas') {
    const extras = candidates.slice(0, Math.min(4, maxStops));
    return orderAlongPath([start, ...extras.map((e) => e.id), end], nodesMap);
  }

  if (priorityMode === 'Maximum Coverage') {
    const extras = candidates.slice(0, Math.min(6, maxStops));
    return orderAlongPath([start, ...extras.map((e) => e.id), end], nodesMap);
  }

  // Balanced
  const extras = candidates.slice(0, Math.min(3, maxStops));
  return orderAlongPath([start, ...extras.map((e) => e.id), end], nodesMap);
};

/** Nearest-neighbor ordering from start toward end */
const orderAlongPath = (ids, nodesMap) => {
  if (ids.length <= 2) return ids;
  const start = ids[0];
  const end = ids[ids.length - 1];
  const remaining = ids.slice(1, -1);
  const ordered = [start];
  let current = start;

  while (remaining.length) {
    remaining.sort((a, b) => {
      const da = haversineKm(nodesMap[current].lat, nodesMap[current].lng, nodesMap[a].lat, nodesMap[a].lng);
      const db = haversineKm(nodesMap[current].lat, nodesMap[current].lng, nodesMap[b].lat, nodesMap[b].lng);
      return da - db;
    });
    const next = remaining.shift();
    ordered.push(next);
    current = next;
  }
  ordered.push(end);
  return ordered;
};

module.exports = {
  aStar,
  dijkstra,
  kShortestPaths,
  buildGraph,
  enrichPathWithHotspots,
  edgeCost,
  haversineKm,
};

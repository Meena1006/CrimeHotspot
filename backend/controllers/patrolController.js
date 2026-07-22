const Crypto = require('crypto');
const mongoose = require('mongoose');
const Crime = require('../models/Crime');
const Patrol = require('../models/Patrol');
const { dbscan, haversineKm } = require('../utils/dbscan');
const { computeRisk, severityToNumber } = require('../utils/riskScore');
const {
  aStar,
  kShortestPaths,
  buildGraph,
  enrichPathWithHotspots,
} = require('../utils/pathfinding');
const { getRoute, estimateRoute } = require('../utils/osrm');

const SHIFT_START = {
  Morning: '06:00',
  Afternoon: '14:00',
  Night: '22:00',
};

/** Downsample polyline for storage/transfer while keeping shape. */
const simplifyGeometry = (geometry, maxPoints = 180) => {
  if (!geometry || geometry.length <= maxPoints) return geometry || [];
  const step = Math.ceil(geometry.length / maxPoints);
  const simplified = [];
  for (let i = 0; i < geometry.length; i += step) {
    simplified.push(geometry[i]);
  }
  const last = geometry[geometry.length - 1];
  const prev = simplified[simplified.length - 1];
  if (!prev || prev[0] !== last[0] || prev[1] !== last[1]) {
    simplified.push(last);
  }
  return simplified;
};

const generateRouteId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PR-${ts}-${rand}`;
};

const formatTime = (baseHHMM, addMinutes) => {
  const [h, m] = baseHHMM.split(':').map(Number);
  const total = h * 60 + m + Math.round(addMinutes);
  const hh = Math.floor(((total % 1440) + 1440) % 1440 / 60);
  const mm = ((total % 1440) + 1440) % 1440 % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

/**
 * Aggregate crimes into named area hotspots + DBSCAN spatial clusters.
 */
const buildHotspotNodes = async () => {
  const crimes = await Crime.find();
  const byArea = {};

  crimes.forEach((crime) => {
    const key = crime.locationName;
    if (!byArea[key]) {
      byArea[key] = {
        area: key,
        lat: crime.latitude,
        lng: crime.longitude,
        severities: [],
        dates: [],
        count: 0,
      };
    }
    byArea[key].count += 1;
    byArea[key].severities.push(severityToNumber(crime.severity));
    byArea[key].dates.push(crime.crimeDate);
    byArea[key].lat =
      (byArea[key].lat * (byArea[key].count - 1) + crime.latitude) / byArea[key].count;
    byArea[key].lng =
      (byArea[key].lng * (byArea[key].count - 1) + crime.longitude) / byArea[key].count;
  });

  const areaNodes = Object.values(byArea).map((loc) => {
    const risk = computeRisk({
      crimeCount: loc.count,
      severities: loc.severities,
      dates: loc.dates,
    });
    return {
      id: `area:${loc.area}`,
      name: loc.area,
      lat: loc.lat,
      lng: loc.lng,
      type: 'hotspot',
      ...risk,
    };
  });

  // DBSCAN on individual crime points → spatial clusters
  const points = crimes.map((c) => ({
    lat: c.latitude,
    lng: c.longitude,
    severity: severityToNumber(c.severity),
    date: c.crimeDate,
    locationName: c.locationName,
  }));

  const clusters = dbscan(points, 1.2, 3);
  const clusterNodes = clusters.map((cl, idx) => {
    const risk = computeRisk({
      crimeCount: cl.points.length,
      severities: cl.points.map((p) => p.severity),
      dates: cl.points.map((p) => p.date),
    });
    // Name cluster after dominant nearby area
    const nameVotes = {};
    cl.points.forEach((p) => {
      nameVotes[p.locationName] = (nameVotes[p.locationName] || 0) + 1;
    });
    const dominant = Object.entries(nameVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || `Cluster ${idx + 1}`;
    return {
      id: `cluster:${idx}`,
      name: `${dominant} Cluster`,
      lat: cl.centroid.lat,
      lng: cl.centroid.lng,
      type: 'hotspot',
      clusterSize: cl.points.length,
      ...risk,
    };
  });

  // Prefer named area nodes for dropdowns; keep clusters for graph enrichment
  return { areaNodes, clusterNodes, allNodes: [...areaNodes, ...clusterNodes] };
};

const findNodeByName = (nodes, name) =>
  nodes.find((n) => n.name.toLowerCase() === name.toLowerCase()) ||
  nodes.find((n) => n.name.toLowerCase().includes(name.toLowerCase()));

const buildStopsFromPath = (pathIds, nodesMap, shift, osrmResult) => {
  const startTime = SHIFT_START[shift] || '08:00';
  let elapsed = 0;
  const stops = [];

  pathIds.forEach((id, index) => {
    const node = nodesMap[id];
    const stopDuration = node.type === 'hotspot' && index > 0 && index < pathIds.length - 1 ? 5 : 2;
    const arrival = formatTime(startTime, elapsed);
    const departure = formatTime(startTime, elapsed + stopDuration);

    // Add leg travel time for next iteration
    if (osrmResult?.legs?.[index]) {
      elapsed += osrmResult.legs[index].durationMin + stopDuration;
    } else if (index < pathIds.length - 1) {
      const next = nodesMap[pathIds[index + 1]];
      const dist = haversineKm(node.lat, node.lng, next.lat, next.lng) * 1.35;
      elapsed += (dist / 22) * 60 + stopDuration;
    } else {
      elapsed += stopDuration;
    }

    let role = 'intermediate';
    if (index === 0) role = 'start';
    else if (index === pathIds.length - 1) role = 'destination';

    stops.push({
      order: index + 1,
      locationName: node.name,
      lat: node.lat,
      lng: node.lng,
      riskLevel: node.riskLevel || 'Low',
      riskScore: node.riskScore || 0,
      crimeCount: node.crimeCount || 0,
      arrivalTime: arrival,
      departureTime: departure,
      stopDuration,
      status: 'Pending',
      guardedAt: null,
      isEndpoint: role !== 'intermediate',
      role,
    });
  });

  return stops;
};

const summarizeRoute = (stops, areaNodes, osrmResult) => {
  const intermediates = stops.filter((s) => s.role === 'intermediate');
  const riskScores = stops.map((s) => s.riskScore || 0);
  const avgRisk = riskScores.length
    ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
    : 0;
  const highest = [...stops].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))[0];
  const highCovered = intermediates.filter((s) => s.riskLevel === 'High').length;
  const totalHigh = areaNodes.filter((n) => n.riskLevel === 'High').length || 1;
  const coveragePercentage = Math.min(
    100,
    Math.round(((intermediates.length + 2) / Math.max(areaNodes.length, 1)) * 100)
  );
  const riskCoverage = Math.min(100, Math.round((highCovered / totalHigh) * 100));

  return {
    estimatedDistance: Math.round((osrmResult?.distanceKm || 0) * 100) / 100,
    estimatedTime: Math.round(osrmResult?.durationMin || 0),
    hotspotsCovered: intermediates.length,
    highestRiskArea: highest?.locationName || 'N/A',
    averageRisk: Math.round(avgRisk * 10) / 10,
    coveragePercentage,
    riskCoverage,
  };
};

const assembleRoutePayload = async ({
  fromLocation,
  toLocation,
  priorityMode,
  maxPatrolTime,
  shift,
  avoidPaths = [],
  alternativeIndex = 0,
}) => {
  const { areaNodes, allNodes } = await buildHotspotNodes();

  if (areaNodes.length < 2) {
    return { error: 'Insufficient hotspot data to plan a patrol route.', status: 400 };
  }

  let fromNode = findNodeByName(areaNodes, fromLocation);
  let toNode = findNodeByName(areaNodes, toLocation);

  if (!fromNode || !toNode) {
    return { error: 'From or To location not found in hotspot database.', status: 400 };
  }
  if (fromNode.id === toNode.id) {
    return { error: 'From and To locations must be different.', status: 400 };
  }

  const { graph, nodesMap } = buildGraph(allNodes.length ? allNodes : areaNodes, priorityMode);

  // Ensure from/to are in graph (area nodes are)
  if (!nodesMap[fromNode.id]) nodesMap[fromNode.id] = fromNode;
  if (!nodesMap[toNode.id]) nodesMap[toNode.id] = toNode;

  let pathResult;
  if (alternativeIndex > 0 || avoidPaths.length) {
    const alts = kShortestPaths(
      graph,
      nodesMap,
      fromNode.id,
      toNode.id,
      priorityMode,
      3,
      avoidPaths
    );
    pathResult = alts[Math.min(alternativeIndex, alts.length - 1)] || alts[0];
  } else {
    pathResult = aStar(graph, nodesMap, fromNode.id, toNode.id, priorityMode);
  }

  if (!pathResult || !pathResult.path?.length) {
    return { error: 'Unable to compute a valid patrol path between selected locations.', status: 400 };
  }

  let pathIds = enrichPathWithHotspots(pathResult.path, nodesMap, priorityMode);

  // Deduplicate consecutive
  pathIds = pathIds.filter((id, i, arr) => i === 0 || id !== arr[i - 1]);

  const waypoints = pathIds.map((id) => ({
    lat: nodesMap[id].lat,
    lng: nodesMap[id].lng,
    name: nodesMap[id].name,
  }));

  let osrmResult = await getRoute(waypoints);
  if (!osrmResult) {
    osrmResult = estimateRoute(waypoints, haversineKm);
  }

  // Add stop durations into total estimated time
  const intermediateCount = Math.max(0, pathIds.length - 2);
  const stopBuffer = intermediateCount * 5;
  const totalEstimated = Math.round(osrmResult.durationMin + stopBuffer);

  // Time feasibility check
  if (totalEstimated > maxPatrolTime) {
    return {
      feasible: false,
      warning: {
        title: 'Patrol Not Feasible',
        message: 'The selected maximum patrol duration is insufficient.',
        estimatedTravelTime: totalEstimated,
        maximumSelected: maxPatrolTime,
        suggestions: [
          'Increase patrol duration',
          'Choose nearby destination',
          'Select Shortest Route mode',
        ],
      },
    };
  }

    const stops = buildStopsFromPath(pathIds, nodesMap, shift, osrmResult);
  const summary = summarizeRoute(stops, areaNodes, {
    ...osrmResult,
    durationMin: totalEstimated,
  });

  return {
    feasible: true,
    algorithm: pathResult.algorithm || 'A*',
    pathIds,
    stops,
    geometry: simplifyGeometry(osrmResult.geometry),
    summary,
    osrmFallback: Boolean(osrmResult.fallback),
    areaNodes,
  };
};

exports.getPatrolLocations = async (req, res) => {
  try {
    const { areaNodes } = await buildHotspotNodes();
    const locations = areaNodes
      .map((n) => ({
        name: n.name,
        lat: n.lat,
        lng: n.lng,
        crimeCount: n.crimeCount,
        riskLevel: n.riskLevel,
        riskScore: n.riskScore,
      }))
      .sort((a, b) => b.crimeCount - a.crimeCount);

    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateRoute = async (req, res) => {
  try {
    const {
      officerName,
      officerId,
      patrolDate,
      shift,
      fromLocation,
      toLocation,
      maxPatrolTime,
      priorityMode,
    } = req.body;

    if (!officerName || !officerId || !fromLocation || !toLocation || !shift || !priorityMode) {
      return res.status(400).json({ success: false, message: 'Missing required patrol fields.' });
    }

    const result = await assembleRoutePayload({
      fromLocation,
      toLocation,
      priorityMode,
      maxPatrolTime: Number(maxPatrolTime) || 60,
      shift,
    });

    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.error });
    }

    if (!result.feasible) {
      return res.status(200).json({
        success: true,
        feasible: false,
        warning: result.warning,
      });
    }

    const draft = {
      routeId: generateRouteId(),
      officerName,
      officerId,
      patrolDate: patrolDate ? new Date(patrolDate) : new Date(),
      shift,
      fromLocation,
      toLocation,
      priorityMode,
      maxPatrolTime: Number(maxPatrolTime) || 60,
      status: 'draft',
      ...result.summary,
      algorithm: result.algorithm,
      geometry: result.geometry,
      stops: result.stops,
      generatedAt: new Date(),
      userId: req.user?._id,
    };

    res.status(200).json({
      success: true,
      feasible: true,
      data: draft,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateAlternatives = async (req, res) => {
  try {
    const {
      fromLocation,
      toLocation,
      maxPatrolTime,
      priorityMode,
      shift,
      currentPathIds = [],
    } = req.body;

    const alternatives = [];
    const avoidPaths = currentPathIds.length ? [currentPathIds] : [];

    for (let i = 0; i < 3; i++) {
      const result = await assembleRoutePayload({
        fromLocation,
        toLocation,
        priorityMode,
        maxPatrolTime: Number(maxPatrolTime) || 90,
        shift: shift || 'Morning',
        avoidPaths,
        alternativeIndex: i,
      });

      if (result.error || !result.feasible) continue;

      const key = result.pathIds.join('>');
      if (alternatives.some((a) => a.pathIds.join('>') === key)) continue;

      alternatives.push({
        label: `Alternative ${alternatives.length + 1}`,
        pathIds: result.pathIds,
        stops: result.stops,
        geometry: result.geometry,
        algorithm: result.algorithm,
        ...result.summary,
      });

      avoidPaths.push(result.pathIds);
    }

    if (!alternatives.length) {
      return res.status(200).json({
        success: true,
        feasible: false,
        warning: {
          title: 'No Alternative Routes',
          message: 'Could not find alternative patrol routes within the selected time limit.',
          suggestions: ['Increase patrol duration', 'Try Balanced or Maximum Coverage mode'],
        },
      });
    }

    res.status(200).json({ success: true, feasible: true, data: alternatives });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.lockPatrol = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload?.routeId || !payload?.stops?.length) {
      return res.status(400).json({ success: false, message: 'Invalid patrol payload.' });
    }

    const existing = await Patrol.findOne({ routeId: payload.routeId });
    if (existing && existing.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Patrol is already locked.' });
    }

    // Mark first stop as Current
    const stops = payload.stops.map((s, i) => ({
      ...s,
      status: i === 0 ? 'Current' : 'Pending',
    }));

    const doc = {
      ...payload,
      stops,
      status: 'active',
      lockedAt: new Date(),
      userId: req.user?._id,
    };

    const patrol = existing
      ? await Patrol.findOneAndUpdate({ routeId: payload.routeId }, doc, { new: true })
      : await Patrol.create(doc);

    res.status(201).json({ success: true, message: 'Patrol locked and activated.', data: patrol });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Route ID already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const findPatrolByIdOrRoute = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
    const byId = await Patrol.findById(id);
    if (byId) return byId;
  }
  return Patrol.findOne({ routeId: id });
};

exports.markGuarded = async (req, res) => {
  try {
    const { id } = req.params;
    const { stopOrder } = req.body;

    const patrol = await findPatrolByIdOrRoute(id);

    if (!patrol) {
      return res.status(404).json({ success: false, message: 'Patrol not found.' });
    }
    if (patrol.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Patrol must be active (locked) to mark locations as guarded.',
      });
    }

    const stop = patrol.stops.find((s) => s.order === Number(stopOrder));
    if (!stop) {
      return res.status(404).json({ success: false, message: 'Stop not found.' });
    }
    if (stop.status === 'Visited') {
      return res.status(400).json({ success: false, message: 'Location already guarded.' });
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Auto-complete start when first stop is guarded
    const start = patrol.stops.find((s) => s.role === 'start');
    if (start && start.status !== 'Visited' && stop.role !== 'start') {
      start.status = 'Visited';
      start.guardedAt = now;
      if (!start.departureTime) start.departureTime = timeStr;
    }

    stop.status = 'Visited';
    stop.guardedAt = now;
    stop.departureTime = timeStr;
    if (!stop.arrivalTime) stop.arrivalTime = timeStr;

    patrol.stops.forEach((s) => {
      if (s.status === 'Current' && s.order !== stop.order) s.status = 'Pending';
    });
    const next = patrol.stops
      .filter((s) => s.status === 'Pending')
      .sort((a, b) => a.order - b.order)[0];
    if (next) next.status = 'Current';

    const allDone = patrol.stops.every((s) => s.status === 'Visited');

    if (allDone) {
      patrol.status = 'completed';
      patrol.completedAt = now;
      if (patrol.lockedAt) {
        patrol.actualTime = Math.round((now - new Date(patrol.lockedAt)) / 60000);
      }
    }

    patrol.markModified('stops');
    await patrol.save();

    const visitedCount = patrol.stops.filter((s) => s.status === 'Visited').length;
    const progress = {
      visited: visitedCount,
      total: patrol.stops.length,
      remaining: patrol.stops.length - visitedCount,
      percent: Math.round((visitedCount / patrol.stops.length) * 100),
    };

    res.status(200).json({
      success: true,
      message: allDone ? 'Patrol completed!' : 'Location marked as guarded.',
      data: patrol,
      progress,
      completed: allDone,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const filter = {};
    if (req.query.officerId) filter.officerId = req.query.officerId;
    if (req.query.status) filter.status = req.query.status;

    const patrols = await Patrol.find(filter).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, count: patrols.length, data: patrols });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPatrol = async (req, res) => {
  try {
    const patrol = await findPatrolByIdOrRoute(req.params.id);
    if (!patrol) {
      return res.status(404).json({ success: false, message: 'Patrol not found.' });
    }
    res.status(200).json({ success: true, data: patrol });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

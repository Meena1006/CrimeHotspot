const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    locationName: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    riskLevel: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Low' },
    riskScore: { type: Number, default: 0 },
    crimeCount: { type: Number, default: 0 },
    arrivalTime: { type: String, default: null },
    departureTime: { type: String, default: null },
    stopDuration: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ['Pending', 'Visited', 'Skipped', 'Current'],
      default: 'Pending',
    },
    guardedAt: { type: Date, default: null },
    isEndpoint: { type: Boolean, default: false },
    role: { type: String, enum: ['start', 'intermediate', 'destination'], default: 'intermediate' },
  },
  { _id: false }
);

const patrolSchema = new mongoose.Schema(
  {
    routeId: { type: String, required: true, unique: true, index: true },
    officerName: { type: String, required: true },
    officerId: { type: String, required: true },
    patrolDate: { type: Date, required: true },
    shift: { type: String, enum: ['Morning', 'Afternoon', 'Night'], required: true },
    fromLocation: { type: String, required: true },
    toLocation: { type: String, required: true },
    priorityMode: {
      type: String,
      enum: ['Shortest Route', 'Highest Risk Areas', 'Balanced', 'Maximum Coverage'],
      required: true,
    },
    maxPatrolTime: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed'],
      default: 'draft',
    },
    estimatedDistance: { type: Number, default: 0 },
    estimatedTime: { type: Number, default: 0 },
    actualTime: { type: Number, default: null },
    riskCoverage: { type: Number, default: 0 },
    coveragePercentage: { type: Number, default: 0 },
    averageRisk: { type: Number, default: 0 },
    highestRiskArea: { type: String, default: 'N/A' },
    hotspotsCovered: { type: Number, default: 0 },
    algorithm: { type: String, default: 'A*' },
    geometry: { type: [[Number]], default: [] },
    stops: { type: [stopSchema], default: [] },
    alternatives: { type: Array, default: [] },
    lockedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    generatedAt: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patrol', patrolSchema);

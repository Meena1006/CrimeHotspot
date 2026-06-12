const mongoose = require('mongoose');

const CRIME_TYPES = [
  'Theft',
  'Vehicle Theft',
  'Assault',
  'Drug Crime',
  'Cyber Crime',
  'Robbery',
  'Fraud',
];

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const crimeSchema = new mongoose.Schema(
  {
    crimeType: {
      type: String,
      required: [true, 'Crime type is required'],
      enum: {
        values: CRIME_TYPES,
        message: 'Invalid crime type',
      },
    },
    locationName: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Invalid latitude'],
      max: [90, 'Invalid latitude'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Invalid longitude'],
      max: [180, 'Invalid longitude'],
    },
    crimeDate: {
      type: Date,
      required: [true, 'Crime date is required'],
    },
    crimeTime: {
      type: String,
      required: [true, 'Crime time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'],
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: SEVERITY_LEVELS,
        message: 'Severity must be Low, Medium, High, or Critical',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    officerName: {
      type: String,
      required: [true, 'Officer name is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

crimeSchema.index({ locationName: 1 });
crimeSchema.index({ crimeDate: 1 });
crimeSchema.index({ crimeType: 1 });

module.exports = mongoose.model('Crime', crimeSchema);
module.exports.CRIME_TYPES = CRIME_TYPES;
module.exports.SEVERITY_LEVELS = SEVERITY_LEVELS;

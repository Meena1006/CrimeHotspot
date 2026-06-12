require('dotenv').config();
const mongoose = require('mongoose');
const Crime = require('../models/Crime');
const User = require('../models/User');
const connectDB = require('../database/connection');

const CHENNAI_LOCATIONS = {
  'T Nagar': { lat: 13.0418, lng: 80.2341, weight: 25, tier: 'high' },
  Velachery: { lat: 12.9815, lng: 80.218, weight: 22, tier: 'high' },
  'Anna Nagar': { lat: 13.085, lng: 80.2101, weight: 15, tier: 'medium' },
  Tambaram: { lat: 12.9249, lng: 80.100, weight: 14, tier: 'medium' },
  Adyar: { lat: 13.0067, lng: 80.2577, weight: 8, tier: 'low' },
  Mylapore: { lat: 13.0339, lng: 80.2619, weight: 7, tier: 'low' },
  Porur: { lat: 13.0358, lng: 80.1567, weight: 10, tier: 'medium' },
  Guindy: { lat: 13.0067, lng: 80.2206, weight: 12, tier: 'medium' },
  Kodambakkam: { lat: 13.051, lng: 80.223, weight: 11, tier: 'medium' },
  Perambur: { lat: 13.1143, lng: 80.235, weight: 9, tier: 'low' },
  Royapuram: { lat: 13.1067, lng: 80.2967, weight: 10, tier: 'medium' },
  Ambattur: { lat: 13.1143, lng: 80.148, weight: 13, tier: 'medium' },
  Sholinganallur: { lat: 12.901, lng: 80.2279, weight: 14, tier: 'medium' },
  OMR: { lat: 12.9165, lng: 80.2369, weight: 16, tier: 'medium' },
  Egmore: { lat: 13.0732, lng: 80.2609, weight: 11, tier: 'medium' },
};

const CRIME_TYPES = [
  'Theft',
  'Vehicle Theft',
  'Assault',
  'Drug Crime',
  'Cyber Crime',
  'Robbery',
  'Fraud',
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const DESCRIPTIONS = {
  Theft: [
    'Mobile phone stolen from pedestrian near market area',
    'Shoplifting incident reported at retail store',
    'Purse snatching reported near bus stand',
    'House break-in, valuables stolen',
    'Pickpocketing incident at crowded junction',
  ],
  'Vehicle Theft': [
    'Two-wheeler stolen from parking area',
    'Car stolen from residential street overnight',
    'Bike theft reported from apartment parking',
    'Auto-rickshaw stolen from stand',
    'Scooter theft near metro station',
  ],
  Assault: [
    'Physical altercation between two groups',
    'Assault case reported near bar area',
    'Road rage incident escalated to violence',
    'Domestic violence complaint filed',
    'Street fight reported by witnesses',
  ],
  'Drug Crime': [
    'Drug peddling activity reported near slum area',
    'Narcotics seized during routine check',
    'Suspected drug deal near railway station',
    'Substance abuse reported at public park',
    'Drug possession case registered',
  ],
  'Cyber Crime': [
    'Online fraud via phishing email',
    'UPI payment scam reported by victim',
    'Social media impersonation fraud',
    'OTP fraud case registered',
    'Fake investment scheme reported',
  ],
  Robbery: [
    'Armed robbery at jewelry store',
    'Highway robbery on outskirts',
    'ATM robbery attempt reported',
    'Robbery at convenience store',
    'Chain snatching on busy road',
  ],
  Fraud: [
    'Credit card fraud reported',
    'Fake document fraud case',
    'Insurance fraud investigation opened',
    'Employment scam reported by job seeker',
    'Real estate fraud complaint filed',
  ],
};

const OFFICERS = [
  'Inspector Ravi Kumar',
  'Sub-Inspector Priya Menon',
  'Inspector Suresh Babu',
  'Sub-Inspector Anitha Raj',
  'Inspector Karthik Venkat',
  'Sub-Inspector Deepa Sharma',
  'Inspector Mohan Das',
  'Sub-Inspector Lakshmi Narayan',
];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomOffset = (maxOffset = 0.015) => {
  return (Math.random() - 0.5) * 2 * maxOffset;
};

const randomDate = (daysBack = 365) => {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return past;
};

const randomTime = () => {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const getSeverityForTier = (tier) => {
  const weights =
    tier === 'high'
      ? { Low: 0.1, Medium: 0.3, High: 0.4, Critical: 0.2 }
      : tier === 'medium'
        ? { Low: 0.25, Medium: 0.4, High: 0.25, Critical: 0.1 }
        : { Low: 0.5, Medium: 0.35, High: 0.1, Critical: 0.05 };

  const rand = Math.random();
  let cumulative = 0;
  for (const [severity, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand <= cumulative) return severity;
  }
  return 'Medium';
};

const generateCrimes = (count = 220) => {
  const locations = Object.entries(CHENNAI_LOCATIONS);
  const weightedLocations = [];

  locations.forEach(([name, data]) => {
    for (let i = 0; i < data.weight; i++) {
      weightedLocations.push([name, data]);
    }
  });

  const crimes = [];

  for (let i = 0; i < count; i++) {
    const [locationName, locData] = randomItem(weightedLocations);
    const crimeType = randomItem(CRIME_TYPES);
    const crimeDate = randomDate(180);

    crimes.push({
      crimeType,
      locationName,
      latitude: parseFloat((locData.lat + randomOffset()).toFixed(6)),
      longitude: parseFloat((locData.lng + randomOffset()).toFixed(6)),
      crimeDate,
      crimeTime: randomTime(),
      severity: getSeverityForTier(locData.tier),
      description: randomItem(DESCRIPTIONS[crimeType]),
      officerName: randomItem(OFFICERS),
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 8; i++) {
    const [locationName, locData] = randomItem(weightedLocations);
    const crimeType = randomItem(CRIME_TYPES);
    crimes.push({
      crimeType,
      locationName,
      latitude: parseFloat((locData.lat + randomOffset()).toFixed(6)),
      longitude: parseFloat((locData.lng + randomOffset()).toFixed(6)),
      crimeDate: today,
      crimeTime: randomTime(),
      severity: getSeverityForTier(locData.tier),
      description: randomItem(DESCRIPTIONS[crimeType]),
      officerName: randomItem(OFFICERS),
    });
  }

  return crimes;
};

const seedDatabase = async () => {
  try {
    await connectDB();

    await Crime.deleteMany({});
    console.log('Cleared existing crime records');

    const crimes = generateCrimes(220);
    await Crime.insertMany(crimes);
    console.log(`Inserted ${crimes.length} crime records`);

    const adminExists = await User.findOne({ email: 'admin@chennaipolice.gov.in' });
    if (!adminExists) {
      await User.create({
        name: 'Admin Officer',
        email: 'admin@chennaipolice.gov.in',
        password: 'admin123',
        role: 'Admin',
      });
      console.log('Default admin created: admin@chennaipolice.gov.in / admin123');
    }

    const officerExists = await User.findOne({ email: 'officer@chennaipolice.gov.in' });
    if (!officerExists) {
      await User.create({
        name: 'Field Officer',
        email: 'officer@chennaipolice.gov.in',
        password: 'officer123',
        role: 'Officer',
      });
      console.log('Default officer created: officer@chennaipolice.gov.in / officer123');
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();

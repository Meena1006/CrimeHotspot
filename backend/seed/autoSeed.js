const Crime = require('../models/Crime');
const User = require('../models/User');

const CHENNAI_LOCATIONS = {
  'T Nagar': { lat: 13.0418, lng: 80.2341, weight: 25, tier: 'high' },
  Velachery: { lat: 12.9815, lng: 80.218, weight: 22, tier: 'high' },
  'Anna Nagar': { lat: 13.085, lng: 80.2101, weight: 15, tier: 'medium' },
  Tambaram: { lat: 12.9249, lng: 80.1, weight: 14, tier: 'medium' },
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

const CRIME_TYPES = ['Theft', 'Vehicle Theft', 'Assault', 'Drug Crime', 'Cyber Crime', 'Robbery', 'Fraud'];
const OFFICERS = ['Inspector Ravi Kumar', 'Sub-Inspector Priya Menon', 'Inspector Suresh Babu', 'Sub-Inspector Anitha Raj'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomOffset = () => (Math.random() - 0.5) * 0.03;
const randomTime = () => `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;

const getSeverityForTier = (tier) => {
  const r = Math.random();
  if (tier === 'high') return r < 0.2 ? 'Critical' : r < 0.6 ? 'High' : r < 0.85 ? 'Medium' : 'Low';
  if (tier === 'medium') return r < 0.1 ? 'Critical' : r < 0.35 ? 'High' : r < 0.75 ? 'Medium' : 'Low';
  return r < 0.05 ? 'Critical' : r < 0.15 ? 'High' : r < 0.5 ? 'Medium' : 'Low';
};

const generateCrimes = () => {
  const weighted = [];
  Object.entries(CHENNAI_LOCATIONS).forEach(([name, data]) => {
    for (let i = 0; i < data.weight; i++) weighted.push([name, data]);
  });

  const crimes = [];
  for (let i = 0; i < 220; i++) {
    const [locationName, loc] = randomItem(weighted);
    crimes.push({
      crimeType: randomItem(CRIME_TYPES),
      locationName,
      latitude: parseFloat((loc.lat + randomOffset()).toFixed(6)),
      longitude: parseFloat((loc.lng + randomOffset()).toFixed(6)),
      crimeDate: new Date(Date.now() - Math.random() * 180 * 86400000),
      crimeTime: randomTime(),
      severity: getSeverityForTier(loc.tier),
      description: 'Synthetic crime report for Chennai hotspot analytics dashboard seed data.',
      officerName: randomItem(OFFICERS),
    });
  }
  return crimes;
};

const autoSeed = async () => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const count = await Crime.countDocuments();
    if (count > 0) return;

    console.log('No crime data found. Auto-seeding database...');
    await Crime.insertMany(generateCrimes());

    const adminExists = await User.findOne({ email: 'admin@chennaipolice.gov.in' });
    if (!adminExists) {
      await User.create({ name: 'Admin Officer', email: 'admin@chennaipolice.gov.in', password: 'admin123', role: 'Admin' });
    }
    const officerExists = await User.findOne({ email: 'officer@chennaipolice.gov.in' });
    if (!officerExists) {
      await User.create({ name: 'Field Officer', email: 'officer@chennaipolice.gov.in', password: 'officer123', role: 'Officer' });
    }
    console.log('Auto-seed completed: 220 crime records inserted.');
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
};

module.exports = autoSeed;

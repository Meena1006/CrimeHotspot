require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./database/connection');
const authRoutes = require('./routes/authRoutes');
const crimeRoutes = require('./routes/crimeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const patrolRoutes = require('./routes/patrolRoutes');

const app = express();

connectDB();

const autoSeed = require('./seed/autoSeed');
autoSeed();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Crime Hotspot Mapping & Analytics API',
    version: '1.0.0',
  });
});

app.use('/auth', authRoutes);
app.use('/crime', crimeRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/patrol', patrolRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

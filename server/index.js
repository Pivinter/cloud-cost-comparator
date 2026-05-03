const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Підключення до MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cloud-cost-comparator';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const calculateRoutes = require('./routes/calculate');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');

app.use('/api', calculateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cloud Cost Comparator API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

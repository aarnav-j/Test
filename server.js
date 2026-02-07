const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for latest sensor data
let latestSensorData = null;
let lastUpdateTime = null;

// ===========================
// ENDPOINT 1: POST /api/sensor-data
// ===========================
// Receives sensor data from ESP32
app.post('/api/sensor-data', (req, res) => {
  try {
    const { temperature, heartRate, motion, distanceButton } = req.body;

    // Validate that all required fields are present
    if (
      temperature === undefined ||
      heartRate === undefined ||
      motion === undefined ||
      distanceButton === undefined
    ) {
      return res.status(400).json({
        error: 'Missing required fields: temperature, heartRate, motion, distanceButton',
      });
    }

    // Store the latest data
    latestSensorData = {
      temperature: parseFloat(temperature),
      heartRate: parseInt(heartRate),
      motion: Boolean(motion),
      distanceButton: Boolean(distanceButton),
    };

    lastUpdateTime = new Date().toISOString();

    console.log(`[${lastUpdateTime}] Received sensor data:`, latestSensorData);

    res.json({
      status: 'success',
      message: 'Data received and stored',
      data: latestSensorData,
      timestamp: lastUpdateTime,
    });
  } catch (error) {
    console.error('Error processing sensor data:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// ===========================
// ENDPOINT 2: GET /api/latest-data
// ===========================
// Returns the latest stored sensor data
app.get('/api/latest-data', (req, res) => {
  if (latestSensorData === null) {
    return res.json({
      status: 'waiting',
      message: 'No sensor data available yet. Waiting for ESP32 to send data...',
      data: null,
      timestamp: null,
    });
  }

  res.json({
    status: 'success',
    message: 'Latest sensor data retrieved',
    data: latestSensorData,
    timestamp: lastUpdateTime,
  });
});

// ===========================
// Health Check Endpoint
// ===========================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    uptime: process.uptime(),
  });
});

// ===========================
// API Info Endpoint
// ===========================
app.get('/api/info', (req, res) => {
  res.json({
    status: 'ok',
    message: 'IoT Sensor Backend is running',
    endpoints: {
      'POST /api/sensor-data': 'ESP32 sends sensor data here',
      'GET /api/latest-data': 'Get latest sensor data (JSON format)',
      'GET /api/health': 'Health check endpoint',
      'GET /': 'Dashboard (HTML)'
    },
    dataFormat: {
      temperature: 'float (°C)',
      heartRate: 'integer (BPM)',
      motion: 'boolean',
      distanceButton: 'boolean'
    }
  });
});

// ===========================
// Serve Dashboard at Root
// ===========================
app.use(express.static('./public'));

// ===========================
// Error Handling
// ===========================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
});

// ===========================
// Start Server
// ===========================

// For development (HTTP)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✓ IoT Sensor Backend running on http://localhost:${PORT}`);
  console.log(`  - POST   /api/sensor-data      (ESP32 sends data here)`);
  console.log(`  - GET    /api/latest-data      (Dashboard fetches from here)`);
  console.log(`  - GET    /api/health           (Health check)`);
});

// Note: For HTTPS in production, use a service like Render or Railway that provides SSL
// They handle HTTPS automatically when you deploy this backend

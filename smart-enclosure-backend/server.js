const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(cors({
  origin: ['https://bruck.gg', 'https://api.bruck.gg'],
  credentials: true
}))

const RASPI_API_URL = 'http://100.96.44.128:3010';

// PostgreSQL DB config
const pool = new Pool({
  user: 'smart_user',
  host: 'localhost',
  database: 'smart_enclosure',
  password: 'sh9mKM&$Nk68',
  port: 5432,
});

// Receive sensor data and insert into TimescaleDB
app.post('/sensor-data', async (req, res) => {
  const readings = req.body;
  let inserted = 0;

  try {
    for (const r of readings) {
      const { timestamp, sensor_id, temperature, humidity, pressure } = r;
      if (!sensor_id || !timestamp) continue;

      await pool.query(
        `INSERT INTO sensor_data (timestamp, sensor_id, temperature, humidity, pressure)
         VALUES (to_timestamp($1), $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [timestamp / 1000, sensor_id, temperature, humidity, pressure]
      );
      inserted++;
    }
    console.log(`✅ Inserted ${inserted} sensor readings to DB`);
    res.status(200).json({ message: 'Sensor data stored' });
  } catch (err) {
    console.error('❌ DB insert error:', err.message);
    res.status(500).json({ error: 'Failed to store sensor data' });
  }
});

// Query latest values and join zones from sensor_attributes
app.get('/zones/averages', async (req, res) => {
  const sql = `
    WITH latest_readings AS (
      SELECT DISTINCT ON (sensor_id) *
      FROM sensor_data
      ORDER BY sensor_id, timestamp DESC
    )
    SELECT
      sa.zone,
      AVG(lr.temperature) AS avg_temp
    FROM latest_readings lr
    JOIN sensor_attributes sa ON lr.sensor_id = sa.sensor_id
    WHERE lr.temperature IS NOT NULL
    GROUP BY sa.zone;
  `;

  try {
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch zone averages:', err.message);
    res.status(500).json({ error: 'Failed to fetch averages' });
  }
});

app.get('/api/temperature-daily', async (req, res) => {
  const { date, interval = '22 minutes' } = req.query;
  if (!date) return res.status(400).json({ error: 'Missing date parameter' });

  try {
    // Convert date to timestamp range in your local timezone
    const startTime = `${date} 00:00:00-04:00`; // Eastern Time
    const endTime = `${date} 23:59:59-04:00`;   // Eastern Time
    
    // First, get the raw data
    const rawData = await pool.query(`
      SELECT 
        time_bucket($3::interval, sd.timestamp) AS bucket,
        sa.zone,
        AVG(sd.temperature) AS raw_temp
      FROM sensor_data sd
      JOIN sensor_attributes sa ON sd.sensor_id = sa.sensor_id
      WHERE sd.timestamp >= $1::timestamptz AND sd.timestamp <= $2::timestamptz
      GROUP BY bucket, sa.zone
      ORDER BY bucket, sa.zone;
    `, [startTime, endTime, interval]);
    
    // Process the data in JavaScript to filter out the spikes
    const processedData = [];
    const zoneData = {};
    
    // Configuration parameters for spike detection
    const deviationThreshold = 8;  // Temperature difference to consider a spike
    const windowSize = 7;          // Number of points to consider on each side
    
    // Group by zone first
    rawData.rows.forEach(row => {
      if (!zoneData[row.zone]) {
        zoneData[row.zone] = [];
      }
      zoneData[row.zone].push({
        bucket: row.bucket,
        raw_temp: row.raw_temp
      });
    });
    
    // Process each zone to detect and fix spikes
    Object.keys(zoneData).forEach(zone => {
      const zonePoints = zoneData[zone];
      
      // Sort by bucket to ensure time order
      zonePoints.sort((a, b) => new Date(a.bucket) - new Date(b.bucket));
      
      // Process each point looking for spikes
      for (let i = 0; i < zonePoints.length; i++) {
        let filteredTemp = zonePoints[i].raw_temp;
        
        // Check if we have enough points on both sides for the window
        if (i >= windowSize && i < zonePoints.length - windowSize) {
          // Calculate average of preceding points
          let prevSum = 0;
          for (let j = 1; j <= windowSize; j++) {
            prevSum += zonePoints[i-j].raw_temp;
          }
          const prevAvg = prevSum / windowSize;
          
          // Calculate average of following points
          let nextSum = 0;
          for (let j = 1; j <= windowSize; j++) {
            nextSum += zonePoints[i+j].raw_temp;
          }
          const nextAvg = nextSum / windowSize;
          
          // If this point deviates significantly from both neighbor averages
          if (Math.abs(filteredTemp - prevAvg) > deviationThreshold && 
              Math.abs(filteredTemp - nextAvg) > deviationThreshold) {
            // Replace with average of neighboring averages
            filteredTemp = (prevAvg + nextAvg) / 2;
          }
        }
        
        processedData.push({
          bucket: zonePoints[i].bucket,
          zone: zone,
          avg_temp: filteredTemp
        });
      }
    });
    
    // Return the processed data
    res.json(processedData);
  } catch (err) {
    console.error('Failed to fetch daily data:', err.message);
    res.status(500).json({ error: 'Query failed' });
  }
});

app.post('/relay-control', async (req, res) => {
  const { relay_id, state } = req.body;

  if (!['1', '2', '3', '4'].includes(relay_id) || !['on', 'off'].includes(state)) {
    return res.status(400).json({ error: 'Invalid relay_id or state' });
  }

  try {
    const response = await axios.post(`${RASPI_API_URL}/api/relay-control`, { relay_id, state });
    res.json(response.data);
  } catch (error) {
    console.error('Failed to control relay on Pi:', error.message);
    res.status(502).json({ error: 'Failed to control relay on Raspberry Pi' });
  }
});

app.get('/relay-status', async (req, res) => {
  try {
    const response = await axios.get(`${RASPI_API_URL}/api/relay-status`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching relay status from Pi:", error.message);
    res.status(502).json({ error: 'Failed to fetch relay status from Raspberry Pi' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server running on port ${PORT}`);
});

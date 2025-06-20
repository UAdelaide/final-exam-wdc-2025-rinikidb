const express = require('express');
const pool = require('./db');

const app = express();
const PORT = 3000;

// Insert sample records on startup
async function insertSampleData() {
  try {
    const conn = await pool.getConnection();

    // Insert users
    await conn.query(`
        INSERT INTO Users (username, email, password_hash, role)
        VALUES
            ('alice123', 'alice@example.com', 'hashed123', 'owner'),
            ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
            ('carol123', 'carol@example.com', 'hashed789', 'owner'),
            ('rinikidas', 'riniki@example.com', 'hashed888', 'walker'),
            ('karisamahroukh', 'karisa@example.com', 'hashed555', 'owner');
    `);

    // Insert dogs
    await conn.query(`
        INSERT INTO Dogs (owner_id, name, size)
        VALUES
            ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
            ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
            ((SELECT user_id FROM Users WHERE username = 'rinikidas'), 'Laika', 'medium'),
            ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Joey', 'small'),
            ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Roxy', 'medium');
    `);

    // Insert walk requests
    await conn.query(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
        VALUES
            ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Laika'), '2025-06-11 07:00:00', 60, 'Central Park', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Joey'), '2025-06-12 10:00:00', 20, 'Mount Osmond', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Roxy'), '2025-06-12 14:00:00', 40, 'Glenelg Beach', 'cancelled');
    `);

    conn.release();
    console.log("Sample data inserted.");
  } catch (err) {
    console.error("Error inserting sample data:", err.message);
  }
}

// Route: /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve dogs' });
  }
});

// Route: /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve walk requests' });
  }
});

// Route: /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.username AS walker_username,
        COUNT(r.rating_id) AS total_ratings,
        ROUND(AVG(r.rating), 1) AS average_rating,
        (
          SELECT COUNT(*)
          FROM WalkApplications a
          JOIN WalkRequests w ON a.request_id = w.request_id
          WHERE a.walker_id = u.user_id AND a.status = 'accepted' AND w.status = 'completed'
        ) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve walker summary' });
  }
});

// Startup
app.listen(PORT, async () => {
  await insertSampleData();
  console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require('express');
const pool = require('./db');

const app = express();
const PORT = 8080;

async function SampleData() {
  try {
    const connection = await pool.getConnection();

    // users
    await connection.query(`
        INSERT IGNORE INTO Users (username, email, password_hash, role)
        VALUES
            ('alice123', 'alice@example.com', 'hashed123', 'owner'),
            ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
            ('carol123', 'carol@example.com', 'hashed789', 'owner'),
            ('rinikidas', 'riniki@example.com', 'hashed888', 'walker'),
            ('karisamahroukh', 'karisa@example.com', 'hashed555', 'owner');
    `);

    // dogs
    await connection.query(`
        INSERT IGNORE INTO Dogs (owner_id, name, size)
        VALUES
            ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
            ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
            ((SELECT user_id FROM Users WHERE username = 'rinikidas'), 'Laika', 'medium'),
            ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Joey', 'small'),
            ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Roxy', 'medium');
    `);

    // walk requests
    await connect.query(`
        INSERT IGNORE INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
        VALUES
            ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Laika'), '2025-06-11 07:00:00', 60, 'Central Park', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Joey'), '2025-06-12 10:00:00', 20, 'Mount Osmond', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Roxy'), '2025-06-12 14:00:00', 40, 'Glenelg Beach', 'cancelled');
    `);

    conn.release();
    // console.log("Sample data inserted.");
  } catch (err) {
    // console.error("Error inserting sample data:", err.message);
  }
}

// /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT Dogs.name AS dog_name, Dogs.size, Users.username AS owner_username
      FROM Dogs
      JOIN Users ON Dogs.owner_id = Users.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve dogs' });
  }
});

// /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT WalkRequests.request_id, Dogs.name AS dog_name, WalkRequests.requested_time, WalkRequests.duration_minutes, WalkRequests.location, Users.username AS owner_username
      FROM WalkRequests
      JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id
      JOIN Users ON Dogs.owner_id = Users.user_id
      WHERE WalkRequests.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve walk requests' });
  }
});

// /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        Users.username AS walker_username,
        COUNT(WalkRatings.rating_id) AS total_ratings,
        ROUND(AVG(WalkRatings.rating), 1) AS average_rating,
        (
          SELECT COUNT(*)
          FROM WalkApplications
          JOIN WalkRequests ON WalkApplications.request_id = WalkRequests.request_id
          WHERE WalkApplications.walker_id = Users.user_id AND WalkApplications.status = 'accepted' AND WalkRequests.status = 'completed'
        ) AS completed_walks
      FROM Users
      LEFT JOIN WalkRatings ON Users.user_id = WalkRatings.walker_id
      WHERE Users.role = 'walker'
      GROUP BY Users.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve walker summary' });
  }
});

// Startup
app.listen(PORT, async () => {
  await SampleData();
  // console.log(`Server is running on http://localhost:${PORT}`);
});

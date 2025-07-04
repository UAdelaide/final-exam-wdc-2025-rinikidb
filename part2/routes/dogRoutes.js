// new file created for clarity
const express = require('express');
const router = express.Router();
const db = require('../models/db');

// to get all the dogs in order to display on the homepage.
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT dog_id, name, size, owner_id FROM Dogs
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// to get the dogs specific to the user when creating a walk request
router.get('/mine', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const ownerId = req.session.user.id;
    const [rows] = await db.query(
      'SELECT dog_id, name FROM Dogs WHERE owner_id = ?',
      [ownerId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;

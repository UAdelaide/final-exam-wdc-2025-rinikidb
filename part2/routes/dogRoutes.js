const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all dogs
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

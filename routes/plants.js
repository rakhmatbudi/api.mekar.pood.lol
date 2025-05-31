// routes/plants.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth'); // Still import it, but won't use it on routes below

// --- GET All Plants ---
router.get('/', async (req, res) => { // Removed authenticateToken
  try {
    const result = await db.query('SELECT * FROM plant ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching plants:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- GET Single Plant by ID ---
router.get('/:id', async (req, res) => { // Removed authenticateToken
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM plant WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching plant by ID:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- CREATE New Plant ---
router.post('/', async (req, res) => { // Removed authenticateToken
  const { category_id, name, last_media_changed, code } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Plant name is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO plant (category_id, name, last_media_changed, code) VALUES ($1, $2, $3, $4) RETURNING *',
      [category_id, name, last_media_changed, code]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating plant:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- UPDATE Plant by ID ---
router.put('/:id', async (req, res) => { // Removed authenticateToken
  const { id } = req.params;
  const { category_id, name, last_media_changed, code } = req.body;

  try {
    const result = await db.query(
      'UPDATE plant SET category_id = $1, name = $2, last_media_changed = $3, code = $4 WHERE id = $5 RETURNING *',
      [category_id, name, last_media_changed, code, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating plant:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- DELETE Plant by ID ---
router.delete('/:id', async (req, res) => { // Removed authenticateToken
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM plant WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    res.json({ message: 'Plant deleted successfully', deletedPlant: result.rows[0] });
  } catch (err) {
    console.error('Error deleting plant:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
// routes/plants.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth'); // Still import it, but won't use it on routes below

// --- GET All Plants ---
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        p.id,
        p.category_id,
        c.name AS category_name,
        p.name,
        p.last_media_changed,
        p.code,
        p.location,          
        p.pot_description,   
        p.watering_frequency, 
        p.notes,
        p.photo_path
      FROM
        plant p
      LEFT JOIN
        category c ON p.category_id = c.id
      ORDER BY
        p.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching plants:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- GET Single Plant by ID ---
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT
        p.id,
        p.category_id,
        c.name AS category_name,
        p.name,
        p.last_media_changed,
        p.code,
        p.location,          
        p.pot_description,   
        p.watering_frequency, 
        p.notes,
        p.photo_path
      FROM
        plant p
      LEFT JOIN
        category c ON p.category_id = c.id
      WHERE
        p.id = $1
    `, [id]);
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
router.post('/', async (req, res) => {
  // Destructure all expected fields, including the new ones
  const { category_id, name, last_media_changed, code, location, pot_description, watering_frequency, notes, photo_path } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Plant name is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO plant (
        category_id,
        name,
        last_media_changed,
        code,
        location,           
        pot_description,    
        watering_frequency, 
        notes,
        photo_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [category_id, name, last_media_changed, code, location, pot_description, watering_frequency, notes, photo_path]
    );

    // After creating, fetch the full plant details including category name
    const newPlantId = result.rows[0].id;
    const fullPlantResult = await db.query(`
      SELECT
        p.id,
        p.category_id,
        c.name AS category_name,
        p.name,
        p.last_media_changed,
        p.code,
        p.location,
        p.pot_description,
        p.watering_frequency,
        p.notes,
        p.photo_path
      FROM
        plant p
      LEFT JOIN
        category c ON p.category_id = c.id
      WHERE
        p.id = $1
    `, [newPlantId]);

    res.status(201).json(fullPlantResult.rows[0]);
  } catch (err) {
    console.error('Error creating plant:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- UPDATE Plant by ID ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  // Destructure all expected fields, including the new ones
  const { category_id, name, last_media_changed, code, location, pot_description, watering_frequency, notes, photo_path } = req.body;

  try {
    const result = await db.query(
      `UPDATE plant SET
        category_id = $1,
        name = $2,
        last_media_changed = $3,
        code = $4,
        location = $5,           
        pot_description = $6,    
        watering_frequency = $7, 
        notes = $8,
        photo_path = $9,
      WHERE id = $10 RETURNING *`,
      [category_id, name, last_media_changed, code, location, pot_description, watering_frequency, notes, photo_path, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    // After updating, fetch the full plant details including category name
    const updatedPlantId = result.rows[0].id;
    const fullPlantResult = await db.query(`
      SELECT
        p.id,
        p.category_id,
        c.name AS category_name,
        p.name,
        p.last_media_changed,
        p.code,
        p.location,
        p.pot_description,
        p.watering_frequency,
        p.notes,
        p.photo_path
      FROM
        plant p
      LEFT JOIN
        category c ON p.category_id = c.id
      WHERE
        p.id = $1
    `, [updatedPlantId]);

    res.json(fullPlantResult.rows[0]);
  } catch (err) {
    console.error('Error updating plant:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- DELETE Plant by ID ---
router.delete('/:id', async (req, res) => {
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
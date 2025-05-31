// routes/categories.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth'); // Still import it, but won't use it on routes below

// --- GET All Categories ---
router.get('/', async (req, res) => { // Removed authenticateToken
  try {
    const result = await db.query('SELECT * FROM category ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- GET Single Category by ID ---
router.get('/:id', async (req, res) => { // Removed authenticateToken
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM category WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching category by ID:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- CREATE New Category ---
router.post('/', async (req, res) => { // Removed authenticateToken
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO category (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- UPDATE Category by ID ---
router.put('/:id', async (req, res) => { // Removed authenticateToken
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await db.query(
      'UPDATE category SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
      if (err.code === '23505') {
          return res.status(409).json({ message: 'Category name already exists' });
      }
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- DELETE Category by ID ---
router.delete('/:id', async (req, res) => { // Removed authenticateToken
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM category WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully', deletedCategory: result.rows[0] });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
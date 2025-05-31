const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For creating JWT tokens
const db = require('../db'); // Database connection

// --- Register User Route ---
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Basic validation for request body
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Insert new user into the database
    const result = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    // Handle duplicate username error
    if (err.code === '23505') { // PostgreSQL error code for unique violation
      return res.status(409).json({ message: 'Username already exists' });
    }
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- Login User Route ---
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Basic validation for request body
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Retrieve user from the database by username
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    // Check if user exists
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Check if password is valid
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If credentials are valid, create a JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username }, // Payload for the token
      process.env.JWT_SECRET, // Secret key for signing the token
      { expiresIn: '1h' } // Token expiration time (1 hour)
    );

    res.json({ message: 'Logged in successfully', token });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; // Export the router
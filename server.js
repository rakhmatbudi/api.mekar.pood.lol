// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const plantRoutes = require('./routes/plants');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories'); 
const cors = require('cors'); // Add this import

const app = express();

// Add CORS middleware BEFORE your routes
app.use(cors()); // This allows all origins

const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/plants', plantRoutes);
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes); // Add this line for category routes

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Plant Service API is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
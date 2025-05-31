const { Pool } = require('pg'); // Import the Pool class from pg

// Create a new Pool instance with database connection details
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Event listener for database connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1); // Exit the process if a critical database error occurs
});

// Export a query function and the pool for use in other modules
module.exports = {
  query: (text, params) => pool.query(text, params), // Helper to run SQL queries
  pool: pool // Export the pool directly for more advanced use if needed
};
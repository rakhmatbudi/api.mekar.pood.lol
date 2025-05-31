const jwt = require('jsonwebtoken'); // Import jsonwebtoken library

// Middleware function to authenticate JWT token
const authenticateToken = (req, res, next) => {
  // Get the authorization header (e.g., "Bearer YOUR_TOKEN")
  const authHeader = req.headers['authorization'];
  // Extract the token from the header (split "Bearer " from the token string)
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401); // If no token is provided, return 401 Unauthorized
  }

  // Verify the token using the JWT_SECRET
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // If token is invalid or expired, return 403 Forbidden
    }
    req.user = user; // Attach the decoded user payload to the request object
    next(); // Proceed to the next middleware/route handler
  });
};

module.exports = authenticateToken; // Export the middleware
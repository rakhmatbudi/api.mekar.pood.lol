// server.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors'); // Import CORS middleware

// Import routes
const plantRoutes = require('./routes/plants');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');

const app = express();

// --- Configuration ---

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Ensures Cloudinary URLs are HTTPS
});

// Multer Configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory buffer
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// --- Middleware ---

// Enable CORS (Cross-Origin Resource Sharing)
// IMPORTANT: In production, restrict 'origin' to your frontend domain(s)
app.use(cors({
  // Example for production and local development:
  // origin: ['https://mekar.pood.lol', 'http://localhost:5173', 'http://localhost:3000'],
  // methods: ['GET', 'POST', 'PUT', 'DELETE'],
  // credentials: true // If your frontend sends cookies or authorization headers that require credentials
}));

// Parse JSON request bodies (with increased limit)
app.use(express.json({ limit: '50mb' }));
// Parse URL-encoded request bodies (with increased limit)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Routes ---

// Image Upload Endpoint
app.post('/api/upload-image', upload.single('image'), async (req, res, next) => {
  try {
    // 1. Check if a file was provided
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }
    
    // 2. Destructure required parameters from request body
    const { plantCode, communityName, communityMemberId, uploadFolder } = req.body;

    // Log received parameters (for debugging)
    console.log(`Received upload request for plantCode: ${plantCode}, communityName: ${communityName}, memberId: ${communityMemberId}, uploadFolder: ${uploadFolder}`);

    // 3. Input validation
    if (!plantCode || !communityName || !communityMemberId || !uploadFolder) {
      return res.status(400).json({
        error: 'Missing required parameters: plantCode, communityName, communityMemberId, uploadFolder.'
      });
    }

    // 4. Construct the target folder path in Cloudinary
    // Example: "Mekar/00000001/APP_PLANT_PHOTO"
    const targetFolder = `${communityName}/${communityMemberId}/${uploadFolder}`;
    
    // 5. Construct the unique filename for the image within that folder
    // This prevents duplication of the folder path in the public_id
    // Example: "some_plant_code_1678901234567"
    const imageFileName = `${plantCode}_${Date.now()}`;

    console.log(`Attempting to upload image for plant: ${plantCode} to Cloudinary folder: ${targetFolder}`);

    // 6. Upload image to Cloudinary using a stream
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image', // Specify resource type as image
          folder: targetFolder,    // The specific folder in your Cloudinary account
          public_id: imageFileName, // The unique name of the file *within* that folder
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Resize and crop
            { quality: 'auto' }, // Auto-optimize quality
            { format: 'auto' }   // Auto-optimize format (e.g., webp, avif)
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(req.file.buffer); // End the stream with the image buffer
    });

    console.log('Image uploaded successfully. Secure URL:', uploadResult.secure_url);

    // 7. Send success response back to the client
    res.status(200).json({
      imageUrl: uploadResult.secure_url, // Full URL of the uploaded image
      publicId: uploadResult.public_id, // Cloudinary's public ID (includes full path)
      message: 'Image uploaded successfully.'
    });

  } catch (error) {
    // Pass any errors to the central error handling middleware
    next(error);
  }
});

// API Routes for other resources
app.use('/plants', plantRoutes);
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);

// Basic route for health check or root access
app.get('/', (req, res) => {
  res.status(200).send('Plant Service API is running!');
});

// --- Error Handling Middleware ---

// This middleware catches any errors passed with next(error)
app.use((error, req, res, next) => {
  console.error('An error occurred:', error.message); // Log the error for server-side debugging

  // Handle Multer-specific errors (from file uploads)
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${error.message}` });
  }

  // Handle specific custom errors
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed!' });
  }

  // Generic error response for any unhandled errors
  res.status(500).json({
    error: 'An unexpected error occurred.',
    // Only expose detailed error messages in development environment
    details: process.env.NODE_ENV === 'development' ? error.message : undefined 
  });
});

// --- Server Start ---
const PORT = process.env.PORT || 3000; // Use port from environment variable or default to 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
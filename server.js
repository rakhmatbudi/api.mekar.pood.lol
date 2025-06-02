// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');

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
  secure: true
});

// Multer Configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// --- Middleware ---

// Enable CORS for all origins. Consider restricting this in production.
app.use(cors());

// Parse JSON and URL-encoded data with increased limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Routes ---

// Image Upload Endpoint
app.post('/api/upload-image', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }
    
    console.log(uploadFolder):

    const { plantCode, communityName, communityMemberId, uploadFolder } = req.body;

    // Input validation
    if (!plantCode || !communityName || !communityMemberId || !uploadFolder) {
      return res.status(400).json({
        error: 'Missing required parameters: plantCode, communityName, communityMemberId, uploadFolder.'
      });
    }

    // Sanitize inputs for security (optional but recommended for production)
    // Example: const sanitizedPlantCode = encodeURIComponent(plantCode);

    const folderPath = `${communityName}/${communityMemberId}/${uploadFolder}`;
    const publicId = `${folderPath}/${plantCode}_${Date.now()}`;

    console.log(`Attempting to upload image for plant: ${plantCode} to folder: ${folderPath}`);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: folderPath,
          public_id: publicId,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
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
      ).end(req.file.buffer);
    });

    console.log('Image uploaded successfully:', uploadResult.secure_url);

    res.status(200).json({
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      message: 'Image uploaded successfully.'
    });

  } catch (error) {
    // Pass the error to the error handling middleware
    next(error);
  }
});

// API Routes
app.use('/plants', plantRoutes);
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);

// Basic route for health check or root access
app.get('/', (req, res) => {
  res.status(200).send('Plant Service API is running!');
});

// --- Error Handling Middleware ---

app.use((error, req, res, next) => {
  console.error('An error occurred:', error.message); // Log the error for debugging

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    // Handle other Multer errors if necessary
    return res.status(400).json({ error: `Upload error: ${error.message}` });
  }

  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed!' });
  }

  // Generic error response for unhandled errors
  res.status(500).json({
    error: 'An unexpected error occurred.',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined // Only expose details in development
  });
});

// --- Server Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
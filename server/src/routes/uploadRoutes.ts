import { Router } from 'express';
import { upload, uploadSingleImage } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Allow authenticated admin users to upload images to Cloudinary
router.post('/single', authenticateToken, upload.single('image'), uploadSingleImage);

export default router;

import { Router } from 'express';
import { upload, uploadSingleImage } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Allow admin and client image upload to Cloudinary with fallback
router.post('/single', upload.single('image'), uploadSingleImage);


export default router;

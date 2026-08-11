import { Request, Response } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const uploadSingleImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'holidaycity',
          resource_type: 'image'
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            console.error('Cloudinary Upload Stream Error:', error);
            const base64Image = `data:${req.file!.mimetype};base64,${req.file!.buffer.toString('base64')}`;
            return res.status(200).json({
              success: true,
              message: 'Image uploaded successfully (Local Buffer Fallback)',
              url: base64Image
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully to Cloudinary',
            url: result.secure_url,
            public_id: result.public_id
          });
        }
      );

      uploadStream.end(req.file.buffer);
    } catch (streamErr) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully (Base64 Fallback)',
        url: base64Image
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Image upload failed' });
  }
};


import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { createLoggerWithFunction } from '../logger';

const logger = createLoggerWithFunction('FileUploadMiddleware', { module: 'middleware' });

/**
 * Multer configuration for file uploads
 */
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file per request
  }
});

/**
 * File upload middleware for payment intent images
 */
export const uploadPaymentImage = upload.single('image');

/**
 * Error handling middleware for file uploads
 */
export const handleUploadError = (error: any, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    logger.error({ error: error.message }, 'Multer error during file upload');
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
        error: {
          code: 'FILE_TOO_LARGE',
          details: { maxSize: '5MB' }
        },
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one image is allowed per request.',
        error: {
          code: 'TOO_MANY_FILES',
          details: { maxFiles: 1 }
        },
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'File upload error.',
      error: {
        code: 'UPLOAD_ERROR',
        details: { message: error.message }
      },
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
      error: {
        code: 'INVALID_FILE_TYPE',
        details: { allowedTypes: ['JPEG', 'PNG', 'WebP', 'GIF'] }
      },
      timestamp: new Date().toISOString()
    });
  }
  
  return next(error);
};

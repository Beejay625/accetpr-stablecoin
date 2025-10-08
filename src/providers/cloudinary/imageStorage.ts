import { v2 as cloudinary } from 'cloudinary';
import { createLoggerWithFunction } from '../../logger';
import { validateImageFile, extractPublicIdFromUrl } from './helpers';

/**
 * Cloudinary Image Storage Provider
 * 
 * Handles image uploads to Cloudinary cloud storage
 */
export class ImageStorageService {
  private static logger = createLoggerWithFunction('ImageStorageService', { module: 'provider' });

  /**
   * Initialize Cloudinary configuration
   */
  static initialize(): void {
    const cloudName = process.env['CLOUDINARY_CLOUD_NAME'];
    const apiKey = process.env['CLOUDINARY_API_KEY'];
    const apiSecret = process.env['CLOUDINARY_API_SECRET'];

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is incomplete. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  /**
   * Save uploaded image to Cloudinary
   * 
   * @param file - The uploaded file from multer
   * @param userId - The user ID for organizing images
   * @returns Promise<string> - The Cloudinary image URL
   */
  static async saveImage(file: Express.Multer.File, userId: string): Promise<string> {
    this.logger.info('saveImage', { userId, filename: file.originalname || 'unknown', size: file.size }, 'Uploading image to Cloudinary');

    try {
      // Validate file
      validateImageFile(file);

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
        folder: `stablestack/payment-intents/${userId}`,
        public_id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        resource_type: 'auto',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      });

      this.logger.info('saveImage', { 
        userId, 
        publicId: result.public_id, 
        url: result.secure_url,
        size: result.bytes 
      }, 'Image uploaded successfully to Cloudinary');

      return result.secure_url;
    } catch (error: any) {
      this.logger.error('saveImage', { userId, error: error.message }, 'Failed to upload image to Cloudinary');
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Update existing image on Cloudinary
   * 
   * @param file - The new uploaded file from multer
   * @param oldImageUrl - The existing Cloudinary image URL to replace
   * @param userId - The user ID for organizing images
   * @returns Promise<string> - The new Cloudinary image URL
   */
  static async updateImage(file: Express.Multer.File, oldImageUrl: string, userId: string): Promise<string> {
    this.logger.info('updateImage', { userId, filename: file.originalname || 'unknown', size: file.size, oldImageUrl }, 'Updating image on Cloudinary');

    try {
      // Validate file
      validateImageFile(file);

      // Extract public ID from old URL
      const oldPublicId = extractPublicIdFromUrl(oldImageUrl);
      if (!oldPublicId) {
        throw new Error('Invalid old image URL');
      }

      // Upload new image with same public ID (this replaces the old one)
      const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
        folder: `stablestack/payment-intents/${userId}`,
        public_id: oldPublicId,
        resource_type: 'auto',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      });

      this.logger.info('updateImage', { 
        userId, 
        publicId: result.public_id, 
        url: result.secure_url,
        size: result.bytes 
      }, 'Image updated successfully on Cloudinary');

      return result.secure_url;
    } catch (error: any) {
      this.logger.error('updateImage', { userId, error: error.message }, 'Failed to update image on Cloudinary');
      throw new Error(`Image update failed: ${error.message}`);
    }
  }
}

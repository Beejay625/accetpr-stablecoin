/**
 * Cloudinary Helper Functions
 * 
 * Utility functions for Cloudinary image operations
 */

/**
 * Validate uploaded image file
 */
export function validateImageFile(file: Express.Multer.File): void {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Image file size must be less than 5MB');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Image must be JPEG, PNG, WebP, or GIF format');
  }

  // Check if file has content
  if (!file.buffer || file.buffer.length === 0) {
    throw new Error('Image file is empty');
  }
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    if (!filename) {
      return null;
    }
    return filename.split('.')[0] || null;
  } catch {
    return null;
  }
}

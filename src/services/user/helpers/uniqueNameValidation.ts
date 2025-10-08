import { createLoggerWithFunction } from '../../../logger';
import { userRepository } from '../../../repositories/database/user/userRepository';

/**
 * Validate unique name format
 * Rules: 3-30 characters, alphanumeric and underscores only, must start with letter
 */
export function validateUniqueNameFormat(uniqueName: string): { isValid: boolean; error?: string } {
  const logger = createLoggerWithFunction('validateUniqueNameFormat', { module: 'uniqueName' });
  
  // Check length
  if (uniqueName.length < 3 || uniqueName.length > 30) {
    return { isValid: false, error: 'Unique name must be between 3 and 30 characters' };
  }
  
  // Check format: alphanumeric and underscores only, must start with letter
  const validFormat = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!validFormat.test(uniqueName)) {
    return { isValid: false, error: 'Unique name must start with a letter and contain only letters, numbers, and underscores' };
  }
  
  // Check for reserved words
  const reservedWords = ['admin', 'api', 'app', 'www', 'mail', 'ftp', 'root', 'user', 'test', 'demo'];
  if (reservedWords.includes(uniqueName.toLowerCase())) {
    return { isValid: false, error: 'This unique name is reserved and cannot be used' };
  }
  
  logger.debug({ uniqueName }, 'Unique name format validation passed');
  return { isValid: true };
}

/**
 * Check if unique name is available
 */
export async function isUniqueNameAvailable(uniqueName: string): Promise<{ available: boolean; error?: string }> {
  const logger = createLoggerWithFunction('isUniqueNameAvailable', { module: 'uniqueName' });
  
  try {
    // First validate format
    const formatValidation = validateUniqueNameFormat(uniqueName);
    if (!formatValidation.isValid) {
      return { available: false, error: formatValidation.error || 'Invalid format' };
    }
    
    // Check if name exists in database
    const existingUser = await userRepository.findByUniqueName(uniqueName);
    
    if (existingUser) {
      logger.debug({ uniqueName }, 'Unique name is already taken');
      return { available: false, error: 'This unique name is already taken' };
    }
    
    logger.debug({ uniqueName }, 'Unique name is available');
    return { available: true };
  } catch (error: any) {
    logger.error({ uniqueName, error: error.message }, 'Failed to check unique name availability');
    throw error;
  }
}

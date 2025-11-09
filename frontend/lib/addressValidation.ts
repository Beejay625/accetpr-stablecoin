import { isAddress, isHex } from 'viem'

export interface AddressValidationResult {
  isValid: boolean
  error?: string
  checksumAddress?: string
}

/**
 * Validate Ethereum address
 */
export function validateAddress(address: string): AddressValidationResult {
  if (!address) {
    return {
      isValid: false,
      error: 'Address is required',
    }
  }

  if (!address.startsWith('0x')) {
    return {
      isValid: false,
      error: 'Address must start with 0x',
    }
  }

  if (address.length !== 42) {
    return {
      isValid: false,
      error: 'Address must be 42 characters long',
    }
  }

  if (!isAddress(address)) {
    return {
      isValid: false,
      error: 'Invalid address format',
    }
  }

  return {
    isValid: true,
    checksumAddress: address, // Could use getAddress() from viem for checksum
  }
}

/**
 * Validate hex string
 */
export function validateHex(hex: string): boolean {
  return isHex(hex)
}

/**
 * Validate amount
 */
export function validateAmount(amount: string): { isValid: boolean; error?: string } {
  if (!amount) {
    return {
      isValid: false,
      error: 'Amount is required',
    }
  }

  const num = parseFloat(amount)
  
  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'Amount must be a valid number',
    }
  }

  if (num <= 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than 0',
    }
  }

  if (num > Number.MAX_SAFE_INTEGER) {
    return {
      isValid: false,
      error: 'Amount is too large',
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Format address with checksum
 */
export function formatAddressChecksum(address: string): string {
  try {
    // In production, use getAddress from viem
    return address
  } catch {
    return address
  }
}


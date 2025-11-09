/**
 * Address Book Management
 * Manages saved addresses, whitelists, and address labels
 */

import { type Address } from 'viem'

export interface AddressEntry {
  address: Address
  label: string
  chainId?: number
  isWhitelisted: boolean
  tags: string[]
  createdAt: number
  lastUsed?: number
  notes?: string
}

export interface AddressGroup {
  id: string
  name: string
  addresses: Address[]
  color?: string
}

class AddressBookManager {
  private addresses: Map<Address, AddressEntry> = new Map()
  private groups: Map<string, AddressGroup> = new Map()
  private storageKey = 'address_book'

  constructor() {
    this.loadFromStorage()
  }

  /**
   * Add or update an address entry
   */
  addAddress(entry: Omit<AddressEntry, 'createdAt'>): void {
    const existing = this.addresses.get(entry.address)
    const addressEntry: AddressEntry = {
      ...entry,
      createdAt: existing?.createdAt || Date.now(),
      lastUsed: Date.now(),
    }

    this.addresses.set(entry.address, addressEntry)
    this.saveToStorage()
  }

  /**
   * Get address entry
   */
  getAddress(address: Address): AddressEntry | undefined {
    return this.addresses.get(address)
  }

  /**
   * Get address label or return formatted address
   */
  getAddressLabel(address: Address): string {
    const entry = this.addresses.get(address)
    return entry?.label || this.formatAddress(address)
  }

  /**
   * Format address for display
   */
  formatAddress(address: Address): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * Check if address is whitelisted
   */
  isWhitelisted(address: Address): boolean {
    return this.addresses.get(address)?.isWhitelisted || false
  }

  /**
   * Add address to whitelist
   */
  whitelistAddress(address: Address): void {
    const entry = this.addresses.get(address)
    if (entry) {
      entry.isWhitelisted = true
      this.addresses.set(address, entry)
      this.saveToStorage()
    } else {
      this.addAddress({
        address,
        label: this.formatAddress(address),
        isWhitelisted: true,
        tags: [],
      })
    }
  }

  /**
   * Remove address from whitelist
   */
  removeFromWhitelist(address: Address): void {
    const entry = this.addresses.get(address)
    if (entry) {
      entry.isWhitelisted = false
      this.addresses.set(address, entry)
      this.saveToStorage()
    }
  }

  /**
   * Get all whitelisted addresses
   */
  getWhitelistedAddresses(): AddressEntry[] {
    return Array.from(this.addresses.values()).filter(
      entry => entry.isWhitelisted
    )
  }

  /**
   * Search addresses by label or address
   */
  searchAddresses(query: string): AddressEntry[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.addresses.values()).filter(
      entry =>
        entry.label.toLowerCase().includes(lowerQuery) ||
        entry.address.toLowerCase().includes(lowerQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * Get addresses by tag
   */
  getAddressesByTag(tag: string): AddressEntry[] {
    return Array.from(this.addresses.values()).filter(entry =>
      entry.tags.includes(tag)
    )
  }

  /**
   * Create address group
   */
  createGroup(name: string, addresses: Address[], color?: string): string {
    const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const group: AddressGroup = {
      id,
      name,
      addresses,
      color,
    }
    this.groups.set(id, group)
    this.saveToStorage()
    return id
  }

  /**
   * Get all groups
   */
  getGroups(): AddressGroup[] {
    return Array.from(this.groups.values())
  }

  /**
   * Delete address
   */
  deleteAddress(address: Address): boolean {
    const deleted = this.addresses.delete(address)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * Export addresses as JSON
   */
  exportAddresses(): string {
    return JSON.stringify(
      {
        addresses: Array.from(this.addresses.values()),
        groups: Array.from(this.groups.values()),
      },
      null,
      2
    )
  }

  /**
   * Import addresses from JSON
   */
  importAddresses(json: string): void {
    try {
      const data = JSON.parse(json)
      if (data.addresses) {
        data.addresses.forEach((entry: AddressEntry) => {
          this.addresses.set(entry.address, entry)
        })
      }
      if (data.groups) {
        data.groups.forEach((group: AddressGroup) => {
          this.groups.set(group.id, group)
        })
      }
      this.saveToStorage()
    } catch (error) {
      throw new Error('Invalid address book format')
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        addresses: Array.from(this.addresses.entries()),
        groups: Array.from(this.groups.entries()),
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save address book:', error)
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return

      const data = JSON.parse(stored)
      if (data.addresses) {
        this.addresses = new Map(data.addresses)
      }
      if (data.groups) {
        this.groups = new Map(data.groups)
      }
    } catch (error) {
      console.error('Failed to load address book:', error)
    }
  }
}

// Singleton instance
export const addressBook = new AddressBookManager()


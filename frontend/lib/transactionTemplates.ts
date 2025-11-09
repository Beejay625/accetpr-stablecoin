/**
 * Transaction Templates and Presets
 * Pre-configured transaction templates for common operations
 */

import { type Address } from 'viem'
import { parseUnits } from 'viem'

export interface TransactionTemplate {
  id: string
  name: string
  description: string
  to: Address
  value?: bigint
  data?: `0x${string}`
  gasLimit?: bigint
  category: 'payment' | 'deployment' | 'interaction' | 'swap' | 'custom'
  tags: string[]
  isFavorite: boolean
  createdAt: number
  lastUsed?: number
  useCount: number
}

export interface TemplateCategory {
  id: string
  name: string
  icon?: string
  templates: TransactionTemplate[]
}

class TransactionTemplateManager {
  private templates: Map<string, TransactionTemplate> = new Map()
  private storageKey = 'transaction_templates'

  constructor() {
    this.loadFromStorage()
    this.initializeDefaultTemplates()
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    if (this.templates.size > 0) return // Already initialized

    const defaults: Omit<TransactionTemplate, 'id' | 'createdAt' | 'useCount'>[] = [
      {
        name: 'Send ETH',
        description: 'Standard ETH transfer',
        to: '0x' as Address,
        value: parseUnits('0.1', 18),
        category: 'payment',
        tags: ['eth', 'transfer'],
        isFavorite: true,
      },
      {
        name: 'Send USDC',
        description: 'USDC token transfer',
        to: '0x' as Address,
        category: 'payment',
        tags: ['usdc', 'stablecoin'],
        isFavorite: true,
      },
      {
        name: 'Send USDT',
        description: 'USDT token transfer',
        to: '0x' as Address,
        category: 'payment',
        tags: ['usdt', 'stablecoin'],
        isFavorite: false,
      },
    ]

    defaults.forEach(template => {
      this.createTemplate(template)
    })
  }

  /**
   * Create a new template
   */
  createTemplate(
    template: Omit<TransactionTemplate, 'id' | 'createdAt' | 'useCount' | 'lastUsed'>
  ): string {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullTemplate: TransactionTemplate = {
      ...template,
      id,
      createdAt: Date.now(),
      useCount: 0,
    }

    this.templates.set(id, fullTemplate)
    this.saveToStorage()
    return id
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): TransactionTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * Get all templates
   */
  getAllTemplates(): TransactionTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TransactionTemplate['category']): TransactionTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    )
  }

  /**
   * Get favorite templates
   */
  getFavoriteTemplates(): TransactionTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.isFavorite
    )
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): TransactionTemplate[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.templates.values()).filter(
      template =>
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * Update template
   */
  updateTemplate(id: string, updates: Partial<TransactionTemplate>): boolean {
    const template = this.templates.get(id)
    if (!template) return false

    this.templates.set(id, { ...template, ...updates })
    this.saveToStorage()
    return true
  }

  /**
   * Mark template as used
   */
  markAsUsed(id: string): void {
    const template = this.templates.get(id)
    if (template) {
      template.useCount++
      template.lastUsed = Date.now()
      this.templates.set(id, template)
      this.saveToStorage()
    }
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    const deleted = this.templates.delete(id)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * Export templates
   */
  exportTemplates(): string {
    return JSON.stringify(Array.from(this.templates.values()), null, 2)
  }

  /**
   * Import templates
   */
  importTemplates(json: string): void {
    try {
      const templates: TransactionTemplate[] = JSON.parse(json)
      templates.forEach(template => {
        this.templates.set(template.id, template)
      })
      this.saveToStorage()
    } catch (error) {
      throw new Error('Invalid template format')
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = Array.from(this.templates.entries())
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save templates:', error)
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

      const data: [string, TransactionTemplate][] = JSON.parse(stored)
      this.templates = new Map(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }
}

// Singleton instance
export const templateManager = new TransactionTemplateManager()


export interface TransactionTemplate {
  id: string
  name: string
  description: string
  chain: string
  asset: string
  amount: string
  recipientAddress: string
  reference?: string
  metadata?: Record<string, any>
}

const STORAGE_KEY = 'transaction_templates'

class TransactionTemplateManager {
  /**
   * Get all templates
   */
  getAll(): TransactionTemplate[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Get template by ID
   */
  get(id: string): TransactionTemplate | null {
    const templates = this.getAll()
    return templates.find((t) => t.id === id) || null
  }

  /**
   * Save template
   */
  save(template: Omit<TransactionTemplate, 'id'>): string {
    const templates = this.getAll()
    const id = `template_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newTemplate: TransactionTemplate = {
      ...template,
      id,
    }

    templates.push(newTemplate)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
    return id
  }

  /**
   * Update template
   */
  update(id: string, updates: Partial<TransactionTemplate>): boolean {
    const templates = this.getAll()
    const index = templates.findIndex((t) => t.id === id)

    if (index === -1) return false

    templates[index] = { ...templates[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
    return true
  }

  /**
   * Delete template
   */
  delete(id: string): boolean {
    const templates = this.getAll()
    const filtered = templates.filter((t) => t.id !== id)

    if (filtered.length === templates.length) return false

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  }

  /**
   * Get templates by chain
   */
  getByChain(chain: string): TransactionTemplate[] {
    return this.getAll().filter((t) => t.chain === chain)
  }
}

export const transactionTemplates = new TransactionTemplateManager()

// Default templates
export const DEFAULT_TEMPLATES: Omit<TransactionTemplate, 'id'>[] = [
  {
    name: 'Quick USDC Transfer',
    description: 'Standard USDC transfer',
    chain: 'base',
    asset: 'USDC',
    amount: '100',
    recipientAddress: '',
  },
  {
    name: 'Monthly Payment',
    description: 'Recurring monthly payment',
    chain: 'base',
    asset: 'USDC',
    amount: '500',
    recipientAddress: '',
    reference: 'Monthly payment',
  },
]

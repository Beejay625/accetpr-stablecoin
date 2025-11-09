export interface TransactionNote {
  transactionId: string
  hash: string
  note: string
  createdAt: number
  updatedAt: number
}

class TransactionNotesManager {
  private notes: Map<string, TransactionNote> = new Map()
  private listeners: Array<(notes: Map<string, TransactionNote>) => void> = []

  /**
   * Add or update note
   */
  setNote(transactionId: string, hash: string, note: string): void {
    const existing = this.notes.get(transactionId)
    const now = Date.now()

    const transactionNote: TransactionNote = {
      transactionId,
      hash,
      note,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }

    this.notes.set(transactionId, transactionNote)
    this.notifyListeners()
    this.persist()
  }

  /**
   * Get note for transaction
   */
  getNote(transactionId: string): TransactionNote | null {
    return this.notes.get(transactionId) || null
  }

  /**
   * Get note by hash
   */
  getNoteByHash(hash: string): TransactionNote | null {
    for (const note of this.notes.values()) {
      if (note.hash === hash) {
        return note
      }
    }
    return null
  }

  /**
   * Delete note
   */
  deleteNote(transactionId: string): void {
    this.notes.delete(transactionId)
    this.notifyListeners()
    this.persist()
  }

  /**
   * Get all notes
   */
  getAllNotes(): TransactionNote[] {
    return Array.from(this.notes.values())
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback: (notes: Map<string, TransactionNote>) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(new Map(this.notes)))
  }

  /**
   * Persist to localStorage
   */
  private persist(): void {
    try {
      const data = Array.from(this.notes.entries())
      localStorage.setItem('transaction_notes', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist notes:', error)
    }
  }

  /**
   * Load from localStorage
   */
  load(): void {
    try {
      const stored = localStorage.getItem('transaction_notes')
      if (stored) {
        const data = JSON.parse(stored) as [string, TransactionNote][]
        this.notes = new Map(data)
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Failed to load notes:', error)
    }
  }

  /**
   * Export notes
   */
  export(): string {
    return JSON.stringify(Array.from(this.notes.entries()), null, 2)
  }

  /**
   * Import notes
   */
  import(data: string): void {
    try {
      const parsed = JSON.parse(data) as [string, TransactionNote][]
      parsed.forEach(([id, note]) => {
        this.notes.set(id, note)
      })
      this.notifyListeners()
      this.persist()
    } catch (error) {
      throw new Error('Invalid notes format')
    }
  }
}

export const transactionNotes = new TransactionNotesManager()

// Load on initialization
if (typeof window !== 'undefined') {
  transactionNotes.load()
}


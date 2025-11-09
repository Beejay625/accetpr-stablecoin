export type ShortcutAction =
  | 'connect_wallet'
  | 'disconnect_wallet'
  | 'refresh_balance'
  | 'new_withdrawal'
  | 'open_settings'
  | 'open_help'
  | 'export_transactions'
  | 'focus_search'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: ShortcutAction
  description: string
}

class KeyboardShortcutManager {
  private shortcuts: KeyboardShortcut[] = []
  private handlers: Map<ShortcutAction, () => void> = new Map()
  private isEnabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this))
    }
  }

  /**
   * Register default shortcuts
   */
  registerDefaults(): void {
    this.add({
      key: 'k',
      ctrl: true,
      action: 'focus_search',
      description: 'Focus search',
    })
    this.add({
      key: 'r',
      ctrl: true,
      action: 'refresh_balance',
      description: 'Refresh balance',
    })
    this.add({
      key: 'n',
      ctrl: true,
      action: 'new_withdrawal',
      description: 'New withdrawal',
    })
    this.add({
      key: ',',
      ctrl: true,
      action: 'open_settings',
      description: 'Open settings',
    })
    this.add({
      key: '?',
      shift: true,
      action: 'open_help',
      description: 'Open help',
    })
    this.add({
      key: 'e',
      ctrl: true,
      shift: true,
      action: 'export_transactions',
      description: 'Export transactions',
    })
  }

  /**
   * Add a shortcut
   */
  add(shortcut: KeyboardShortcut): void {
    this.shortcuts.push(shortcut)
  }

  /**
   * Register handler for action
   */
  on(action: ShortcutAction, handler: () => void): () => void {
    this.handlers.set(action, handler)
    return () => {
      this.handlers.delete(action)
    }
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey

    const shortcut = this.shortcuts.find(
      (s) =>
        s.key.toLowerCase() === key &&
        (s.ctrl === undefined || s.ctrl === ctrl) &&
        (s.shift === undefined || s.shift === shift) &&
        (s.alt === undefined || s.alt === alt) &&
        (s.meta === undefined || s.meta === event.metaKey)
    )

    if (shortcut) {
      event.preventDefault()
      const handler = this.handlers.get(shortcut.action)
      if (handler) {
        handler()
      }
    }
  }

  /**
   * Get all shortcuts
   */
  getAll(): KeyboardShortcut[] {
    return [...this.shortcuts]
  }

  /**
   * Get shortcuts for an action
   */
  getForAction(action: ShortcutAction): KeyboardShortcut[] {
    return this.shortcuts.filter((s) => s.action === action)
  }

  /**
   * Enable/disable shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = []
    if (shortcut.ctrl || shortcut.meta) parts.push('⌘')
    if (shortcut.shift) parts.push('⇧')
    if (shortcut.alt) parts.push('⌥')
    parts.push(shortcut.key.toUpperCase())
    return parts.join(' + ')
  }
}

export const keyboardShortcuts = new KeyboardShortcutManager()

// Register defaults
if (typeof window !== 'undefined') {
  keyboardShortcuts.registerDefaults()
}


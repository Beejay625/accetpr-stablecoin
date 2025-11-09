'use client'

import { useState, useEffect } from 'react'
import { transactionTemplates, type TransactionTemplate } from '@/lib/transactionTemplates'

interface TransactionTemplatesProps {
  onSelectTemplate?: (template: TransactionTemplate) => void
}

export default function TransactionTemplates({ onSelectTemplate }: TransactionTemplatesProps) {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    chain: 'base',
    asset: 'USDC',
    amount: '',
    recipientAddress: '',
    reference: '',
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    setTemplates(transactionTemplates.getAll())
  }

  const handleSave = () => {
    if (!formData.name || !formData.amount || !formData.recipientAddress) {
      return
    }

    transactionTemplates.save(formData)
    loadTemplates()
    setFormData({
      name: '',
      description: '',
      chain: 'base',
      asset: 'USDC',
      amount: '',
      recipientAddress: '',
      reference: '',
    })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    transactionTemplates.delete(id)
    loadTemplates()
  }

  const handleSelect = (template: TransactionTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Transaction Templates</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border rounded-lg dark:border-gray-700">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.chain}
                onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="base">Base</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="ethereum">Ethereum</option>
              </select>
              <select
                value={formData.asset}
                onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="text"
              placeholder="Recipient Address"
              value={formData.recipientAddress}
              onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="text"
              placeholder="Reference (optional)"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Template
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No templates saved. Create one to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="p-3 border rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{template.name}</p>
                  {template.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {template.description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{template.chain}</span>
                    <span>{template.asset}</span>
                    <span>{template.amount}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onSelectTemplate && (
                    <button
                      onClick={() => handleSelect(template)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Use
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


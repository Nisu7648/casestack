import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { X, Loader } from 'lucide-react'

interface CreateCaseModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateCaseModal({ onClose, onSuccess }: CreateCaseModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    caseType: 'STRATEGY',
    priority: 'MEDIUM',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budgetTotal: '',
    currency: 'USD',
    hourlyRate: '',
    tags: [] as string[],
    memberIds: [] as string[]
  })

  const [tagInput, setTagInput] = useState('')

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/clients?limit=100')
      return response.data.data.clients
    }
  })

  // Fetch users for team selection
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users?limit=100')
      return response.data.data.users
    }
  })

  // Create case mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/cases', data)
      return response.data
    },
    onSuccess: () => {
      onSuccess()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      budgetTotal: formData.budgetTotal ? parseFloat(formData.budgetTotal) : 0,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  const toggleMember = (userId: string) => {
    if (formData.memberIds.includes(userId)) {
      setFormData({
        ...formData,
        memberIds: formData.memberIds.filter(id => id !== userId)
      })
    } else {
      setFormData({
        ...formData,
        memberIds: [...formData.memberIds, userId]
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Create New Case</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Digital Transformation for Acme Corp"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="Brief description of the case..."
                />
              </div>

              {/* Client and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select client...</option>
                    {clientsData?.map((client: any) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Type *
                  </label>
                  <select
                    value={formData.caseType}
                    onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                    className="input w-full"
                  >
                    <option value="STRATEGY">Strategy</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="TECHNOLOGY">Technology</option>
                    <option value="FINANCIAL">Financial</option>
                    <option value="HR">HR</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="SALES">Sales</option>
                    <option value="LEGAL">Legal</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Priority and Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input w-full"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budgetTotal}
                    onChange={(e) => setFormData({ ...formData, budgetTotal: e.target.value })}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="input w-full"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="input flex-1"
                    placeholder="Add tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn btn-secondary"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Team Members */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Members
                </label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {usersData?.map((user: any) => (
                    <label
                      key={user.id}
                      className="flex items-center space-x-2 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.memberIds.includes(user.id)}
                        onChange={() => toggleMember(user.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {user.firstName} {user.lastName} ({user.role})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary flex items-center space-x-2"
              >
                {createMutation.isPending && (
                  <Loader className="w-4 h-4 animate-spin" />
                )}
                <span>{createMutation.isPending ? 'Creating...' : 'Create Case'}</span>
              </button>
            </div>

            {/* Error */}
            {createMutation.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Failed to create case. Please try again.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

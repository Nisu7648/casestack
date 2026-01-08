import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { X, Loader } from 'lucide-react'

interface CreateTaskModalProps {
  caseId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateTaskModal({ caseId, onClose, onSuccess }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'TASK',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
    estimatedHours: '',
    deliverableType: ''
  })

  // Fetch case details to get team members
  const { data: caseData } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const response = await api.get(`/cases/${caseId}`)
      return response.data.data
    }
  })

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/tasks', { ...data, caseId })
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
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
      assigneeId: formData.assigneeId || null,
      dueDate: formData.dueDate || null
    })
  }

  const teamMembers = caseData ? [
    { id: caseData.lead.id, name: `${caseData.lead.firstName} ${caseData.lead.lastName}`, role: 'Lead' },
    ...caseData.members.map((m: any) => ({
      id: m.user.id,
      name: `${m.user.firstName} ${m.user.lastName}`,
      role: m.role || 'Member'
    }))
  ] : []

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Conduct stakeholder interviews"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="Task details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input w-full"
                  >
                    <option value="TASK">Task</option>
                    <option value="DELIVERABLE">Deliverable</option>
                    <option value="MILESTONE">Milestone</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To
                  </label>
                  <select
                    value={formData.assigneeId}
                    onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  className="input w-full"
                  placeholder="0.0"
                />
              </div>

              {formData.type === 'DELIVERABLE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deliverable Type
                  </label>
                  <input
                    type="text"
                    value={formData.deliverableType}
                    onChange={(e) => setFormData({ ...formData, deliverableType: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Report, Presentation, Model"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary flex items-center space-x-2"
              >
                {createMutation.isPending && <Loader className="w-4 h-4 animate-spin" />}
                <span>{createMutation.isPending ? 'Creating...' : 'Create Task'}</span>
              </button>
            </div>

            {createMutation.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">Failed to create task. Please try again.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

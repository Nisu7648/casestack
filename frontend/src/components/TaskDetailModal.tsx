import { useState } from 'react'
import { useMutation, useQuery } from '@tantml:query'
import api from '../lib/api'
import { X, Loader, MessageSquare, Clock, Play } from 'lucide-react'

interface TaskDetailModalProps {
  task: any
  caseId: string
  onClose: () => void
  onUpdate: () => void
}

export default function TaskDetailModal({ task, caseId, onClose, onUpdate }: TaskDetailModalProps) {
  const [comment, setComment] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority
  })

  // Fetch comments
  const { data: commentsData } = useQuery({
    queryKey: ['task-comments', task.id],
    queryFn: async () => {
      const response = await api.get(`/tasks/${task.id}/comments`)
      return response.data.data
    }
  })

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/tasks/${task.id}/comments`, { content })
      return response.data
    },
    onSuccess: () => {
      setComment('')
      onUpdate()
    }
  })

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/tasks/${task.id}`, data)
      return response.data
    },
    onSuccess: () => {
      setIsEditing(false)
      onUpdate()
    }
  })

  // Start timer mutation
  const startTimerMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/time/start', {
        caseId,
        taskId: task.id,
        description: `Working on ${task.title}`
      })
      return response.data
    },
    onSuccess: () => {
      onUpdate()
      onClose()
    }
  })

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (comment.trim()) {
      addCommentMutation.mutate(comment)
    }
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(editData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => startTimerMutation.mutate()}
                disabled={startTimerMutation.isPending}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Timer</span>
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="input w-full"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="input w-full"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                      className="input w-full"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h4>
                      {task.description && (
                        <p className="text-gray-600">{task.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 font-medium text-gray-900">{task.status.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Priority:</span>
                      <span className="ml-2 font-medium text-gray-900">{task.priority}</span>
                    </div>
                    {task.assignee && (
                      <div>
                        <span className="text-gray-500">Assigned to:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {task.assignee.firstName} {task.assignee.lastName}
                        </span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div>
                        <span className="text-gray-500">Due:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {task.estimatedHours && (
                      <div>
                        <span className="text-gray-500">Estimated:</span>
                        <span className="ml-2 font-medium text-gray-900">{task.estimatedHours}h</span>
                      </div>
                    )}
                    {task.actualHours > 0 && (
                      <div>
                        <span className="text-gray-500">Actual:</span>
                        <span className="ml-2 font-medium text-gray-900">{task.actualHours.toFixed(2)}h</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h5 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Comments ({commentsData?.length || 0})
                  </h5>

                  <form onSubmit={handleAddComment} className="mb-4">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="input w-full"
                      rows={2}
                      placeholder="Add a comment..."
                    />
                    <button
                      type="submit"
                      disabled={!comment.trim() || addCommentMutation.isPending}
                      className="btn btn-primary mt-2"
                    >
                      {addCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
                    </button>
                  </form>

                  <div className="space-y-3">
                    {commentsData?.map((c: any) => (
                      <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {c.user.firstName} {c.user.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

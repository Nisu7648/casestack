import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import {
  ArrowLeft,
  Play,
  Square,
  Plus,
  Clock,
  DollarSign,
  Users,
  FileText,
  Activity,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader,
  Edit,
  Trash2,
  MessageSquare
} from 'lucide-react'
import CreateTaskModal from '../components/CreateTaskModal'
import TaskDetailModal from '../components/TaskDetailModal'

export default function CaseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('tasks')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [timerRunning, setTimerRunning] = useState(false)

  // Fetch case details
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const response = await api.get(`/cases/${id}`)
      return response.data.data
    }
  })

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const response = await api.get(`/tasks/case/${id}`)
      return response.data.data
    },
    enabled: !!id
  })

  // Fetch time entries
  const { data: timeData } = useQuery({
    queryKey: ['time', id],
    queryFn: async () => {
      const response = await api.get(`/time/case/${id}`)
      return response.data.data
    },
    enabled: !!id
  })

  // Fetch active timer
  const { data: activeTimer } = useQuery({
    queryKey: ['active-timer'],
    queryFn: async () => {
      const response = await api.get('/time/active')
      return response.data.data
    },
    refetchInterval: 1000 // Refresh every second
  })

  // Fetch activities
  const { data: activitiesData } = useQuery({
    queryKey: ['activities', id],
    queryFn: async () => {
      const response = await api.get(`/cases/${id}/activities`)
      return response.data.data.activities
    },
    enabled: !!id
  })

  // Start timer mutation
  const startTimerMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/time/start', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['active-timer'])
      queryClient.invalidateQueries(['time', id])
    }
  })

  // Stop timer mutation
  const stopTimerMutation = useMutation({
    mutationFn: async (timerId) => {
      const response = await api.post('/time/stop', { id: timerId })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['active-timer'])
      queryClient.invalidateQueries(['time', id])
      queryClient.invalidateQueries(['case', id])
      queryClient.invalidateQueries(['tasks', id])
    }
  })

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const response = await api.patch(`/tasks/${taskId}/status`, { status })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', id])
      queryClient.invalidateQueries(['case', id])
      queryClient.invalidateQueries(['activities', id])
    }
  })

  const handleStartTimer = (taskId = null) => {
    startTimerMutation.mutate({
      caseId: id,
      taskId,
      description: taskId ? `Working on task` : `Working on case`
    })
  }

  const handleStopTimer = () => {
    if (activeTimer) {
      stopTimerMutation.mutate(activeTimer.id)
    }
  }

  const handleTaskStatusChange = (taskId, newStatus) => {
    updateTaskStatusMutation.mutate({ taskId, status: newStatus })
  }

  const getStatusColor = (status) => {
    const colors = {
      PLANNING: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      ON_HOLD: 'bg-yellow-100 text-yellow-800',
      REVIEW: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'IN_PROGRESS':
        return <Circle className="w-5 h-5 text-blue-500 fill-blue-500" />
      case 'BLOCKED':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Circle className="w-5 h-5 text-gray-300" />
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const [timerSeconds, setTimerSeconds] = useState(0)

  useEffect(() => {
    if (activeTimer && activeTimer.caseId === id) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((new Date() - new Date(activeTimer.startTime)) / 1000)
        setTimerSeconds(elapsed)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeTimer, id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Case not found</h3>
        <Link to="/cases" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to cases
        </Link>
      </div>
    )
  }

  const isTimerActive = activeTimer && activeTimer.caseId === id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate('/cases')}
            className="mt-1 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{caseData.title}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(caseData.status)}`}>
                {caseData.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="font-mono">{caseData.caseNumber}</span>
              <span>•</span>
              <span>{caseData.client.name}</span>
              <span>•</span>
              <span>{caseData.caseType}</span>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center space-x-3">
          {isTimerActive ? (
            <>
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <Clock className="w-5 h-5 text-green-600 animate-pulse" />
                <span className="font-mono text-lg font-semibold text-green-700">
                  {formatDuration(timerSeconds)}
                </span>
              </div>
              <button
                onClick={handleStopTimer}
                disabled={stopTimerMutation.isPending}
                className="btn btn-danger flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleStartTimer()}
              disabled={startTimerMutation.isPending}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Timer</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {caseData.progressPercentage}%
              </p>
            </div>
            <div className="w-16 h-16">
              <svg className="transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="3"
                  strokeDasharray={`${caseData.progressPercentage}, 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Time Logged</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {caseData.metrics.totalHours.toFixed(1)}h
              </p>
            </div>
            <Clock className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${caseData.metrics.totalSpent.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                of ${parseFloat(caseData.budgetTotal).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Team</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {caseData.members.length + 1}
              </p>
            </div>
            <Users className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Context Panel */}
        <div className="space-y-6">
          {/* Case Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Client:</span>
                <p className="font-medium text-gray-900">{caseData.client.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Lead:</span>
                <p className="font-medium text-gray-900">
                  {caseData.lead.firstName} {caseData.lead.lastName}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Timeline:</span>
                <p className="font-medium text-gray-900">
                  {new Date(caseData.startDate).toLocaleDateString()} - {new Date(caseData.endDate).toLocaleDateString()}
                </p>
              </div>
              {caseData.description && (
                <div>
                  <span className="text-gray-500">Description:</span>
                  <p className="text-gray-900 mt-1">{caseData.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Team */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-primary-50">
                <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">
                    {caseData.lead.firstName[0]}{caseData.lead.lastName[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {caseData.lead.firstName} {caseData.lead.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Lead</p>
                </div>
              </div>
              {caseData.members.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-700">
                      {member.user.firstName[0]}{member.user.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{member.role || 'Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Work Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="card">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'tasks'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tasks & Deliverables
                </button>
                <button
                  onClick={() => setActiveTab('time')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'time'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Time Entries
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'activity'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activity Feed
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Tasks Tab */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
                    <button
                      onClick={() => setShowCreateTask(true)}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Task</span>
                    </button>
                  </div>

                  {tasksData && tasksData.length > 0 ? (
                    <div className="space-y-2">
                      {tasksData.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => setSelectedTask(task)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const nextStatus = task.status === 'DONE' ? 'NOT_STARTED' : 
                                               task.status === 'NOT_STARTED' ? 'IN_PROGRESS' : 'DONE'
                              handleTaskStatusChange(task.id, nextStatus)
                            }}
                            className="mt-0.5"
                          >
                            {getTaskStatusIcon(task.status)}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </h4>
                              {task.type === 'DELIVERABLE' && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                  Deliverable
                                </span>
                              )}
                              {task.type === 'MILESTONE' && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                  Milestone
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {task.assignee && (
                                <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                              )}
                              {task.dueDate && (
                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              )}
                              {task._count.comments > 0 && (
                                <span className="flex items-center space-x-1">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{task._count.comments}</span>
                                </span>
                              )}
                              {task.actualHours > 0 && (
                                <span>{task.actualHours.toFixed(1)}h logged</span>
                              )}
                            </div>
                          </div>
                          {isTimerActive && activeTimer.taskId === task.id && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <Clock className="w-4 h-4 animate-pulse" />
                              <span className="text-xs font-medium">Active</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">No tasks yet</p>
                      <button
                        onClick={() => setShowCreateTask(true)}
                        className="btn btn-primary inline-flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create First Task</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Time Tab */}
              {activeTab === 'time' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Time Entries</h3>
                    <div className="text-sm text-gray-500">
                      Total: {timeData?.totals.hours.toFixed(2)}h
                      {timeData?.totals.amount > 0 && ` • $${timeData.totals.amount.toLocaleString()}`}
                    </div>
                  </div>

                  {timeData && timeData.entries.length > 0 ? (
                    <div className="space-y-2">
                      {timeData.entries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {entry.user.firstName} {entry.user.lastName}
                              </span>
                              {entry.task && (
                                <span className="text-xs text-gray-500">• {entry.task.title}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(entry.startTime).toLocaleString()}
                              {entry.description && ` • ${entry.description}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {parseFloat(entry.duration).toFixed(2)}h
                            </p>
                            {entry.amount && (
                              <p className="text-xs text-gray-500">
                                ${parseFloat(entry.amount).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No time entries yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
                  {activitiesData && activitiesData.length > 0 ? (
                    <div className="space-y-3">
                      {activitiesData.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">
                                {activity.user.firstName} {activity.user.lastName}
                              </span>{' '}
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No activity yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateTask && (
        <CreateTaskModal
          caseId={id}
          onClose={() => setShowCreateTask(false)}
          onSuccess={() => {
            setShowCreateTask(false)
            queryClient.invalidateQueries(['tasks', id])
            queryClient.invalidateQueries(['activities', id])
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          caseId={id}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            queryClient.invalidateQueries(['tasks', id])
            queryClient.invalidateQueries(['activities', id])
          }}
        />
      )}
    </div>
  )
}

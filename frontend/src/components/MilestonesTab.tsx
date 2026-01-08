import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tantml:query'
import api from '../lib/api'
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader,
  Edit,
  Trash2
} from 'lucide-react'
import CreateMilestoneModal from '../components/CreateMilestoneModal'

export default function MilestonesTab({ caseId }: { caseId: string }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState(null)

  // Fetch milestones
  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ['milestones', caseId],
    queryFn: async () => {
      const response = await api.get(`/milestones/case/${caseId}`)
      return response.data.data
    }
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'DELAYED':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-blue-500" />
      default:
        return <Target className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      COMPLETED: 'bg-green-100 text-green-800',
      DELAYED: 'bg-red-100 text-red-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      UPCOMING: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const upcomingMilestones = milestonesData?.filter((m: any) => m.status === 'UPCOMING') || []
  const inProgressMilestones = milestonesData?.filter((m: any) => m.status === 'IN_PROGRESS') || []
  const completedMilestones = milestonesData?.filter((m: any) => m.status === 'COMPLETED') || []
  const delayedMilestones = milestonesData?.filter((m: any) => m.status === 'DELAYED') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
          <p className="text-sm text-gray-500 mt-1">
            Track major project milestones and deliverables
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Milestone</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {upcomingMilestones.length}
              </p>
            </div>
            <Target className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="card bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">In Progress</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {inProgressMilestones.length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Completed</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {completedMilestones.length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Delayed</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {delayedMilestones.length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Timeline */}
      {milestonesData && milestonesData.length > 0 ? (
        <div className="card">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Milestones */}
            <div className="space-y-6">
              {milestonesData.map((milestone: any, index: number) => (
                <div key={milestone.id} className="relative flex items-start space-x-4 pl-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0">
                    {getStatusIcon(milestone.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-base font-semibold text-gray-900">
                            {milestone.title}
                          </h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(milestone.status)}`}>
                            {milestone.status.replace('_', ' ')}
                          </span>
                        </div>

                        {milestone.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {milestone.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                          </div>
                          {milestone.daysUntilDue !== undefined && (
                            <span className={`font-medium ${
                              milestone.daysUntilDue < 0 ? 'text-red-600' :
                              milestone.daysUntilDue < 7 ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              {milestone.daysUntilDue < 0
                                ? `${Math.abs(milestone.daysUntilDue)} days overdue`
                                : milestone.daysUntilDue === 0
                                ? 'Due today'
                                : `${milestone.daysUntilDue} days remaining`
                              }
                            </span>
                          )}
                          <span>Owner: {milestone.owner.firstName} {milestone.owner.lastName}</span>
                        </div>

                        {milestone.completedAt && (
                          <p className="text-xs text-green-600 mt-2">
                            ✓ Completed on {new Date(milestone.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedMilestone(milestone)
                            setShowCreateModal(true)
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No milestones yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Milestone</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <CreateMilestoneModal
          caseId={caseId}
          milestone={selectedMilestone}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedMilestone(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setSelectedMilestone(null)
          }}
        />
      )}
    </div>
  )
}

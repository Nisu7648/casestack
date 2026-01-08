import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import {
  Network,
  Plus,
  GitBranch,
  ArrowRight,
  Loader,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react'

export default function DependenciesTab({ caseId }: { caseId: string }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const queryClient = useQueryClient()

  // Fetch workflow (tasks + dependencies)
  const { data: workflowData, isLoading } = useQuery({
    queryKey: ['workflow', caseId],
    queryFn: async () => {
      const response = await api.get(`/workflows/case/${caseId}`)
      return response.data.data
    }
  })

  const dependencyTypes = {
    FINISH_TO_START: { label: 'Finish to Start', icon: '→', color: 'blue' },
    START_TO_START: { label: 'Start to Start', icon: '⇉', color: 'green' },
    FINISH_TO_FINISH: { label: 'Finish to Finish', icon: '⇄', color: 'purple' },
    START_TO_FINISH: { label: 'Start to Finish', icon: '↺', color: 'orange' }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const tasks = workflowData?.tasks || []
  const dependencies = workflowData?.dependencies || []

  // Build dependency graph
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  const dependencyGraph = dependencies.map(dep => ({
    ...dep,
    dependentTaskTitle: taskMap.get(dep.dependentTask.id)?.title || 'Unknown',
    blockingTaskTitle: taskMap.get(dep.blockingTask.id)?.title || 'Unknown'
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Task Dependencies</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage task relationships and workflow sequencing
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dependency</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(dependencyTypes).map(([type, config]) => {
          const count = dependencies.filter(d => d.type === type).length
          return (
            <div key={type} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{config.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                </div>
                <div className={`text-3xl text-${config.color}-500`}>
                  {config.icon}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dependency Types Legend */}
      <div className="card bg-blue-50 border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">Dependency Types</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              →
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Finish to Start (FS)</p>
              <p className="text-xs text-blue-700">Task B starts when Task A finishes</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-600 font-bold">
              ⇉
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">Start to Start (SS)</p>
              <p className="text-xs text-green-700">Both tasks start at the same time</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
              ⇄
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900">Finish to Finish (FF)</p>
              <p className="text-xs text-purple-700">Both tasks finish at the same time</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
              ↺
            </div>
            <div>
              <p className="text-sm font-medium text-orange-900">Start to Finish (SF)</p>
              <p className="text-xs text-orange-700">Task B finishes when Task A starts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dependencies List */}
      {dependencies.length > 0 ? (
        <div className="space-y-3">
          {dependencyGraph.map((dep) => {
            const config = dependencyTypes[dep.type]
            return (
              <div key={dep.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Blocking Task */}
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Blocking Task</p>
                      <p className="text-sm font-medium text-gray-900">
                        {dep.blockingTaskTitle}
                      </p>
                    </div>

                    {/* Dependency Type */}
                    <div className="flex flex-col items-center px-4">
                      <div className={`w-12 h-12 rounded-lg bg-${config.color}-100 flex items-center justify-center text-${config.color}-600 text-2xl font-bold mb-1`}>
                        {config.icon}
                      </div>
                      <p className="text-xs text-gray-500 text-center">{config.label}</p>
                      {dep.lagDays > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          +{dep.lagDays} days lag
                        </p>
                      )}
                    </div>

                    {/* Dependent Task */}
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Dependent Task</p>
                      <p className="text-sm font-medium text-gray-900">
                        {dep.dependentTaskTitle}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Network className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No dependencies defined</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Dependency</span>
          </button>
        </div>
      )}

      {/* Visual Workflow */}
      {tasks.length > 0 && (
        <div className="card">
          <h4 className="text-base font-semibold text-gray-900 mb-4">
            Visual Workflow
          </h4>
          <div className="space-y-2">
            {tasks.map((task, index) => {
              const blockingDeps = dependencies.filter(d => d.blockingTask.id === task.id)
              const dependentDeps = dependencies.filter(d => d.dependentTask.id === task.id)
              
              return (
                <div key={task.id} className="flex items-center space-x-3">
                  <div className={`flex-1 p-3 rounded-lg border-2 ${
                    task.status === 'DONE' ? 'bg-green-50 border-green-200' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-200' :
                    task.status === 'BLOCKED' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {task.status.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {blockingDeps.length > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            Blocks {blockingDeps.length}
                          </span>
                        )}
                        {dependentDeps.length > 0 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                            Depends on {dependentDeps.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Circular Dependency Warning */}
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Circular Dependencies</p>
            <p className="text-xs text-yellow-700 mt-1">
              The system automatically prevents circular dependencies. If Task A depends on Task B, 
              Task B cannot depend on Task A (directly or indirectly).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import {
  AlertTriangle,
  Plus,
  TrendingUp,
  Shield,
  X,
  Loader,
  Edit,
  Trash2
} from 'lucide-react'
import CreateRiskModal from '../components/CreateRiskModal'

export default function RisksTab({ caseId }: { caseId: string }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRisk, setSelectedRisk] = useState(null)
  const queryClient = useQueryClient()

  // Fetch risks
  const { data: risksData, isLoading } = useQuery({
    queryKey: ['risks', caseId],
    queryFn: async () => {
      const response = await api.get(`/risks/case/${caseId}`)
      return response.data.data
    }
  })

  // Close risk mutation
  const closeRiskMutation = useMutation({
    mutationFn: async (riskId: string) => {
      await api.patch(`/risks/${riskId}/close`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['risks', caseId])
    }
  })

  const getRiskColor = (score: number) => {
    if (score >= 12) return 'bg-red-100 text-red-800 border-red-200'
    if (score >= 6) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (score >= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const getRiskLabel = (score: number) => {
    if (score >= 12) return 'CRITICAL'
    if (score >= 6) return 'HIGH'
    if (score >= 3) return 'MEDIUM'
    return 'LOW'
  }

  const getLevelColor = (level: string) => {
    const colors = {
      CRITICAL: 'bg-red-500',
      HIGH: 'bg-orange-500',
      MEDIUM: 'bg-yellow-500',
      LOW: 'bg-green-500'
    }
    return colors[level] || 'bg-gray-500'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const activeRisks = risksData?.risks?.filter((r: any) => r.status !== 'CLOSED') || []
  const closedRisks = risksData?.risks?.filter((r: any) => r.status === 'CLOSED') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Risk Register</h3>
          <p className="text-sm text-gray-500 mt-1">
            Identify, assess, and mitigate project risks
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Risk</span>
        </button>
      </div>

      {/* Risk Matrix Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card border-2 border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Critical</p>
              <p className="text-3xl font-bold text-red-900 mt-1">
                {risksData?.matrix.critical || 0}
              </p>
              <p className="text-xs text-red-600 mt-1">Score 12-16</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="card border-2 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">High</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">
                {risksData?.matrix.high || 0}
              </p>
              <p className="text-xs text-orange-600 mt-1">Score 6-11</p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div className="card border-2 border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Medium</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">
                {risksData?.matrix.medium || 0}
              </p>
              <p className="text-xs text-yellow-600 mt-1">Score 3-5</p>
            </div>
            <Shield className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="card border-2 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Low</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {risksData?.matrix.low || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">Score 1-2</p>
            </div>
            <Shield className="w-10 h-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* Active Risks */}
      {activeRisks.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-gray-900">
            Active Risks ({activeRisks.length})
          </h4>
          <div className="space-y-3">
            {activeRisks.map((risk: any) => (
              <div
                key={risk.id}
                className={`card border-2 ${getRiskColor(risk.riskScore)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="text-base font-semibold text-gray-900">
                        {risk.title}
                      </h5>
                      <span className={`px-2 py-1 text-xs font-bold rounded ${getRiskColor(risk.riskScore)}`}>
                        {getRiskLabel(risk.riskScore)} ({risk.riskScore})
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        {risk.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">
                      {risk.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Probability</p>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getLevelColor(risk.probability)}`} />
                          <span className="text-sm font-medium text-gray-900">
                            {risk.probability}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Impact</p>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getLevelColor(risk.impact)}`} />
                          <span className="text-sm font-medium text-gray-900">
                            {risk.impact}
                          </span>
                        </div>
                      </div>
                    </div>

                    {risk.mitigation && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Mitigation Strategy:</p>
                        <p className="text-sm text-gray-700">{risk.mitigation}</p>
                      </div>
                    )}

                    {risk.contingency && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Contingency Plan:</p>
                        <p className="text-sm text-gray-700">{risk.contingency}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                      {risk.category && <span>Category: {risk.category}</span>}
                      <span>Owner: {risk.owner.firstName} {risk.owner.lastName}</span>
                      <span>Identified: {new Date(risk.identifiedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedRisk(risk)
                        setShowCreateModal(true)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => closeRiskMutation.mutate(risk.id)}
                      disabled={closeRiskMutation.isPending}
                      className="text-gray-400 hover:text-green-600"
                      title="Close risk"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No active risks</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Risk</span>
          </button>
        </div>
      )}

      {/* Closed Risks */}
      {closedRisks.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-gray-900">
            Closed Risks ({closedRisks.length})
          </h4>
          <div className="space-y-2">
            {closedRisks.map((risk: any) => (
              <div key={risk.id} className="card bg-gray-50 opacity-75">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 line-through">
                      {risk.title}
                    </h5>
                    <p className="text-xs text-gray-500 mt-1">
                      Closed on {new Date(risk.closedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    CLOSED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <CreateRiskModal
          caseId={caseId}
          risk={selectedRisk}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedRisk(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setSelectedRisk(null)
          }}
        />
      )}
    </div>
  )
}

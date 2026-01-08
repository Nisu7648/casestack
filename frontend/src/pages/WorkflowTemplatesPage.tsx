import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import {
  LayoutTemplate,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader,
  Play,
  Copy,
  Edit,
  Trash2
} from 'lucide-react'
import CreateTemplateModal from '../components/CreateTemplateModal'
import ApplyTemplateModal from '../components/ApplyTemplateModal'

export default function WorkflowTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const queryClient = useQueryClient()

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['workflow-templates', selectedType],
    queryFn: async () => {
      const params = selectedType !== 'all' ? `?caseType=${selectedType}` : ''
      const response = await api.get(`/workflows/templates${params}`)
      return response.data.data
    }
  })

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/workflows/templates/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflow-templates'])
    }
  })

  const filteredTemplates = templatesData?.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const caseTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'STRATEGY', label: 'Strategy' },
    { value: 'OPERATIONS', label: 'Operations' },
    { value: 'TECHNOLOGY', label: 'Technology' },
    { value: 'FINANCIAL', label: 'Financial' },
    { value: 'HR', label: 'HR' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'SALES', label: 'Sales' },
    { value: 'LEGAL', label: 'Legal' },
    { value: 'OTHER', label: 'Other' }
  ]

  const handleApplyTemplate = (template) => {
    setSelectedTemplate(template)
    setShowApplyModal(true)
  }

  const handleDeleteTemplate = (id) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Templates</h1>
          <p className="text-gray-500 mt-1">
            Create reusable templates to speed up case setup
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {templatesData?.length || 0}
              </p>
            </div>
            <LayoutTemplate className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Most Used</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {templatesData?.reduce((max, t) => Math.max(max, t.usageCount), 0) || 0}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Public Templates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {templatesData?.filter(t => t.isPublic).length || 0}
              </p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {templatesData?.reduce((sum, t) => sum + t.usageCount, 0) * 2 || 0}h
              </p>
            </div>
            <Clock className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input"
            >
              {caseTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const templateData = JSON.parse(template.templateData)
            return (
              <div
                key={template.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      {template.isPublic && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Public
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {template.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium text-gray-900">
                      {template.caseType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tasks:</span>
                    <span className="font-medium text-gray-900">
                      {templateData.tasks?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Milestones:</span>
                    <span className="font-medium text-gray-900">
                      {templateData.milestones?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Used:</span>
                    <span className="font-medium text-gray-900">
                      {template.usageCount} times
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApplyTemplate(template)}
                    className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Apply</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template)
                      setShowCreateModal(true)
                    }}
                    className="btn btn-secondary"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    disabled={deleteMutation.isPending}
                    className="btn btn-secondary text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <LayoutTemplate className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first workflow template to speed up case setup
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateTemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedTemplate(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setSelectedTemplate(null)
            queryClient.invalidateQueries(['workflow-templates'])
          }}
        />
      )}

      {showApplyModal && selectedTemplate && (
        <ApplyTemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowApplyModal(false)
            setSelectedTemplate(null)
          }}
          onSuccess={() => {
            setShowApplyModal(false)
            setSelectedTemplate(null)
          }}
        />
      )}
    </div>
  )
}

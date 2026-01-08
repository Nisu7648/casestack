import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import api from '../lib/api'
import {
  FileText,
  Upload,
  Download,
  Eye,
  Share2,
  Trash2,
  File,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FolderOpen,
  Search,
  Filter,
  MoreVertical,
  Clock,
  User,
  Tag,
  Loader
} from 'lucide-react'

export default function DocumentsTab({ caseId }: { caseId: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDocument, setSelectedDocument] = useState(null)
  const queryClient = useQueryClient()

  // Fetch documents
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', caseId, selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)
      
      const response = await api.get(`/documents/case/${caseId}?${params}`)
      return response.data.data
    }
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', caseId])
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', caseId])
    }
  })

  // Dropzone for file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caseId', caseId)
      formData.append('category', selectedCategory !== 'all' ? selectedCategory : 'OTHER')
      
      uploadMutation.mutate(formData)
    })
  }, [caseId, selectedCategory])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />
    if (mimeType.includes('word')) return <FileText className="w-8 h-8 text-blue-500" />
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) 
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) 
      return <FileText className="w-8 h-8 text-orange-500" />
    if (mimeType.includes('image')) return <FileImage className="w-8 h-8 text-purple-500" />
    if (mimeType.includes('video')) return <FileVideo className="w-8 h-8 text-pink-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownload = async (documentId: string) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.click()
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const handlePreview = async (documentId: string) => {
    window.open(`/api/documents/${documentId}/preview`, '_blank')
  }

  const categories = [
    { value: 'all', label: 'All Documents', icon: FolderOpen },
    { value: 'CONTRACT', label: 'Contracts', icon: FileText },
    { value: 'PROPOSAL', label: 'Proposals', icon: FileText },
    { value: 'REPORT', label: 'Reports', icon: FileText },
    { value: 'PRESENTATION', label: 'Presentations', icon: FileText },
    { value: 'SPREADSHEET', label: 'Spreadsheets', icon: FileSpreadsheet },
    { value: 'CLIENT_BRIEF', label: 'Client Briefs', icon: FileText },
    { value: 'DELIVERABLE', label: 'Deliverables', icon: FileText },
    { value: 'MEETING_NOTES', label: 'Meeting Notes', icon: FileText },
    { value: 'RESEARCH', label: 'Research', icon: FileText },
    { value: 'INVOICE', label: 'Invoices', icon: FileText },
    { value: 'LEGAL', label: 'Legal', icon: FileText },
    { value: 'OTHER', label: 'Other', icon: File }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const documents = documentsData?.documents || []
  const stats = documentsData?.stats || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
          <p className="text-sm text-gray-500 mt-1">
            {stats.total || 0} documents • {formatFileSize(stats.totalSize || 0)}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="btn btn-secondary"
          >
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              PDF, Word, Excel, PowerPoint, Images (Max 50MB)
            </p>
          </>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Documents Grid/List */}
      {documents.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  {getFileIcon(doc.mimeType)}
                  <div className="relative">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-gray-900 mb-2 truncate">
                  {doc.name}
                </h4>

                {doc.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{formatFileSize(parseInt(doc.fileSize))}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                    v{doc.version}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                  <User className="w-3 h-3" />
                  <span>{doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                  <Clock className="w-3 h-3 ml-2" />
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.slice(0, 3).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handlePreview(doc.id)}
                    className="btn btn-secondary flex-1 flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => handleDownload(doc.id)}
                    className="btn btn-secondary"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="btn btn-secondary text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="card flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {getFileIcon(doc.mimeType)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {doc.name}
                    </h4>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(parseInt(doc.fileSize))}</span>
                      <span>v{doc.version}</span>
                      <span>{doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePreview(doc.id)}
                    className="btn btn-secondary"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc.id)}
                    className="btn btn-secondary"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="btn btn-secondary">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="btn btn-secondary text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No documents yet</p>
          <p className="text-sm text-gray-400">
            Upload your first document to get started
          </p>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  Loader,
  Download,
  Filter
} from 'lucide-react'
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('overview')
  const [dateRange, setDateRange] = useState('30')
  const [selectedCase, setSelectedCase] = useState('all')

  // Fetch cases for filter
  const { data: casesData } = useQuery({
    queryKey: ['cases-list'],
    queryFn: async () => {
      const response = await api.get('/cases')
      return response.data.data
    }
  })

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['reports', reportType, dateRange, selectedCase],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard')
      return response.data.data
    }
  })

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await api.post('/analytics/export', {
        type: reportType,
        format,
        dateRange,
        caseId: selectedCase !== 'all' ? selectedCase : undefined
      }, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-${reportType}-${Date.now()}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Insights</h1>
          <p className="text-gray-500 mt-1">
            Comprehensive reporting and data visualization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input w-full"
            >
              <option value="overview">Overview</option>
              <option value="financial">Financial</option>
              <option value="productivity">Productivity</option>
              <option value="utilization">Utilization</option>
              <option value="risks">Risk Analysis</option>
              <option value="milestones">Milestone Tracking</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input w-full"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Filter
            </label>
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Cases</option>
              {casesData?.map((caseItem: any) => (
                <option key={caseItem.id} value={caseItem.id}>
                  {caseItem.caseNumber} - {caseItem.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${(analyticsData?.time.totalRevenue || 0).toLocaleString()}
              </p>
              <div className="flex items-center space-x-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+12.5%</span>
              </div>
            </div>
            <DollarSign className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hours Logged</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(analyticsData?.time.totalHours || 0).toFixed(0)}h
              </p>
              <div className="flex items-center space-x-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+8.3%</span>
              </div>
            </div>
            <Clock className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analyticsData?.tasks.completionRate || 0}%
              </p>
              <div className="flex items-center space-x-1 mt-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">-2.1%</span>
              </div>
            </div>
            <Target className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Cases</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analyticsData?.cases.active || 0}
              </p>
              <div className="flex items-center space-x-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+5</span>
              </div>
            </div>
            <BarChart3 className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Main Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                  label: 'Revenue',
                  data: [45000, 52000, 48000, 61000, 58000, 67000],
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  tension: 0.4
                }]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        {/* Case Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Case Distribution by Type
          </h3>
          <div className="h-64">
            <Doughnut
              data={{
                labels: Object.keys(analyticsData?.cases.byType || {}),
                datasets: [{
                  data: Object.values(analyticsData?.cases.byType || {}),
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                  ]
                }]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Budget Utilization by Case
          </h3>
          <div className="h-64">
            <Bar
              data={{
                labels: ['Case A', 'Case B', 'Case C', 'Case D', 'Case E'],
                datasets: [{
                  label: 'Budget Used (%)',
                  data: [85, 92, 67, 78, 95],
                  backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                  ]
                }]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        {/* Team Performance Radar */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Team Performance Metrics
          </h3>
          <div className="h-64">
            <Radar
              data={{
                labels: ['Productivity', 'Quality', 'Timeliness', 'Collaboration', 'Innovation'],
                datasets: [{
                  label: 'Team Average',
                  data: [85, 90, 78, 92, 75],
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderColor: 'rgb(59, 130, 246)',
                  pointBackgroundColor: 'rgb(59, 130, 246)'
                }]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Performing Cases
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Case
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">CASE-2024-001</div>
                  <div className="text-xs text-gray-500">Strategy Consulting</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  $125,000
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  450h
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    35%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    IN PROGRESS
                  </span>
                </td>
              </tr>
              {/* More rows... */}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-900">Strong Performance</p>
              <p className="text-xs text-green-700 mt-1">
                Revenue up 12.5% compared to last period. Team productivity at all-time high.
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">Attention Needed</p>
              <p className="text-xs text-yellow-700 mt-1">
                3 cases are over 90% budget utilization. Consider resource reallocation.
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Target className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Opportunity</p>
              <p className="text-xs text-blue-700 mt-1">
                Team utilization at 78%. Capacity for 2-3 additional projects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

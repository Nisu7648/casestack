import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Download,
  Calendar,
  Filter,
  Loader
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch dashboard analytics
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics-dashboard', dateRange],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard')
      return response.data.data
    }
  })

  // Fetch team performance
  const { data: teamData } = useQuery({
    queryKey: ['analytics-team'],
    queryFn: async () => {
      const response = await api.get('/analytics/team')
      return response.data.data
    }
  })

  // Fetch budget analytics
  const { data: budgetData } = useQuery({
    queryKey: ['analytics-budget'],
    queryFn: async () => {
      const response = await api.get('/analytics/budget')
      return response.data.data
    }
  })

  const handleExport = async (type: string) => {
    try {
      const response = await api.post('/analytics/export', {
        type,
        format: 'csv'
      }, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${type}-export.csv`)
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

  // Chart data
  const casesByStatusData = {
    labels: Object.keys(analyticsData?.cases.byStatus || {}),
    datasets: [{
      label: 'Cases',
      data: Object.values(analyticsData?.cases.byStatus || {}),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ]
    }]
  }

  const casesByTypeData = {
    labels: Object.keys(analyticsData?.cases.byType || {}),
    datasets: [{
      label: 'Cases',
      data: Object.values(analyticsData?.cases.byType || {}),
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }]
  }

  const teamPerformanceData = {
    labels: teamData?.map((t: any) => t.user.name) || [],
    datasets: [{
      label: 'Hours Logged',
      data: teamData?.map((t: any) => t.time.hours) || [],
      backgroundColor: 'rgba(16, 185, 129, 0.8)'
    }]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-500 mt-1">
            Track performance, budgets, and team productivity
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={() => handleExport('cases')}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Cases</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {analyticsData?.cases.total || 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {analyticsData?.cases.active || 0} active
              </p>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${(analyticsData?.time.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {(analyticsData?.time.totalHours || 0).toFixed(0)}h logged
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Budget Utilization</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {analyticsData?.financials.utilization || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ${(analyticsData?.financials.totalSpent || 0).toLocaleString()} spent
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Task Completion</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {analyticsData?.tasks.completionRate || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {analyticsData?.tasks.completed || 0}/{analyticsData?.tasks.total || 0} tasks
              </p>
            </div>
            <Clock className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'team'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Team Performance
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'budget'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Budget Analysis
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cases by Status
                  </h3>
                  <div className="h-64">
                    <Doughnut data={casesByStatusData} options={{ maintainAspectRatio: false }} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cases by Type
                  </h3>
                  <div className="h-64">
                    <Bar data={casesByTypeData} options={{ maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {analyticsData?.recentActivity?.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary-700">
                          {activity.user.firstName[0]}{activity.user.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">
                            {activity.user.firstName} {activity.user.lastName}
                          </span>{' '}
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.case.caseNumber} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Team Performance Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="h-80">
                <Bar data={teamPerformanceData} options={{ maintainAspectRatio: false }} />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Team Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Completion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamData?.map((member: any) => (
                      <tr key={member.user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {member.user.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            {member.user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.time.hours.toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${member.time.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.tasks.completed}/{member.tasks.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${member.tasks.completionRate}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">
                              {member.tasks.completionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Budget Analysis Tab */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-green-50 border-green-200">
                  <p className="text-sm text-green-700 font-medium">On Track</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {budgetData?.summary.onTrack || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1">cases</p>
                </div>
                <div className="card bg-yellow-50 border-yellow-200">
                  <p className="text-sm text-yellow-700 font-medium">At Risk</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {budgetData?.summary.atRisk || 0}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">cases &gt;90% spent</p>
                </div>
                <div className="card bg-red-50 border-red-200">
                  <p className="text-sm text-red-700 font-medium">Over Budget</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {budgetData?.summary.overBudget || 0}
                  </p>
                  <p className="text-xs text-red-600 mt-1">cases</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Case
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Remaining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Utilization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {budgetData?.cases?.slice(0, 10).map((caseItem: any) => (
                      <tr key={caseItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {caseItem.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {caseItem.caseNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(caseItem.budgetTotal).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(caseItem.budgetSpent).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${caseItem.budgetRemaining.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  caseItem.utilization > 100 ? 'bg-red-500' :
                                  caseItem.utilization > 90 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(caseItem.utilization, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">
                              {caseItem.utilization}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            caseItem.status === 'OVER_BUDGET' ? 'bg-red-100 text-red-800' :
                            caseItem.status === 'AT_RISK' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {caseItem.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

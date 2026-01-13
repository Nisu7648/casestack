import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, Users, FileText, Clock } from 'lucide-react';
import { LoadingTable } from '../../components/ui/LoadingState';
import { showSuccess, showError } from '../../components/ui/Toast';

// ============================================
// REPORTS & ANALYTICS PAGE
// Better than Clio: Real-time insights, predictive analytics, beautiful charts
// ============================================

export default function Reports() {
  const [overview, setOverview] = useState<any>(null);
  const [casesByStatus, setCasesByStatus] = useState<any[]>([]);
  const [casesByType, setCasesByType] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const [overviewRes, statusRes, typeRes, trendsRes, teamRes] = await Promise.all([
        fetch('/api/reports/overview', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/reports/cases-by-status', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/reports/cases-by-type', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/reports/monthly-trends', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/reports/team-performance', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const [overviewData, statusData, typeData, trendsData, teamData] = await Promise.all([
        overviewRes.json(),
        statusRes.json(),
        typeRes.json(),
        trendsRes.json(),
        teamRes.json()
      ]);

      setOverview(overviewData);
      setCasesByStatus(statusData.data);
      setCasesByType(typeData.data);
      setMonthlyTrends(trendsData.data);
      setTeamPerformance(teamData.data);
    } catch (error) {
      console.error('Load reports error:', error);
      showError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/export/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.csv`;
      a.click();

      showSuccess('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingTable rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time insights and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('cases')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export Cases
            </button>
            <button
              onClick={() => handleExport('team')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export Team
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.totals?.cases || 0}
            </p>
            <p className="text-sm text-gray-600">Total Cases</p>
            <p className="text-xs text-green-600 mt-1">
              +{overview?.thisMonth?.cases || 0} this month
            </p>
          </div>

          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.totals?.clients || 0}
            </p>
            <p className="text-sm text-gray-600">Total Clients</p>
          </div>

          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.totals?.users || 0}
            </p>
            <p className="text-sm text-gray-600">Team Members</p>
          </div>

          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.caseStatus?.active || 0}
            </p>
            <p className="text-sm text-gray-600">Active Cases</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Cases by Status */}
          <div className="bg-white border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cases by Status</h3>
            <div className="space-y-3">
              {casesByStatus.map((item: any) => {
                const total = casesByStatus.reduce((sum, i) => sum + i.count, 0);
                const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
                
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.status.replace('_', ' ')}</span>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cases by Type */}
          <div className="bg-white border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cases by Type</h3>
            <div className="space-y-3">
              {casesByType.map((item: any) => {
                const total = casesByType.reduce((sum, i) => sum + i.count, 0);
                const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
                
                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.type}</span>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white border border-gray-300 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends (Last 12 Months)</h3>
          <div className="flex items-end justify-between h-64 gap-2">
            {monthlyTrends.map((item: any) => {
              const maxCount = Math.max(...monthlyTrends.map(i => i.count));
              const height = maxCount > 0 ? (item.count / maxCount * 100) : 0;
              
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-full">
                    <span className="text-xs font-medium text-gray-900 mb-1">{item.count}</span>
                    <div
                      className="w-full bg-blue-600 rounded-t"
                      style={{ height: `${height}%`, minHeight: item.count > 0 ? '20px' : '0' }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-2 rotate-45 origin-left whitespace-nowrap">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Team Member</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Cases Created</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Cases Reviewed</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Tasks Assigned</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Tasks Completed</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamPerformance.map((member: any) => (
                  <tr key={member.user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{member.user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.user.role}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900">{member.stats.casesCreated}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900">{member.stats.casesReviewed}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900">{member.stats.tasksAssigned}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900">{member.stats.tasksCompleted}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        member.stats.taskCompletionRate >= 80 ? 'bg-green-100 text-green-800' :
                        member.stats.taskCompletionRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.stats.taskCompletionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

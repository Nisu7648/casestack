import React, { useState, useEffect } from 'react';
import { Download, Filter } from 'lucide-react';

// ============================================
// 8️⃣ AUDIT LOG SCREEN
// Partners love this screen
// ============================================

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  useEffect(() => {
    loadLogs();
  }, [filters, pagination.page]);

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', pagination.page.toString());
      params.append('limit', '50');

      const response = await fetch(`/api/audit?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Load logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/audit/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casestack-audit-${Date.now()}.csv`;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-600 mt-1">
              Complete audit trail • Immutable • Cannot be deleted
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-300 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">FILTERS</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
              >
                <option value="">All Actions</option>
                <option value="CASE_CREATED">Case Created</option>
                <option value="CASE_SUBMITTED">Case Submitted</option>
                <option value="CASE_REVIEWED">Case Reviewed</option>
                <option value="CASE_FINALIZED">Case Finalized</option>
                <option value="FILE_UPLOADED">File Uploaded</option>
                <option value="FILE_DOWNLOADED">File Downloaded</option>
                <option value="USER_LOGIN">User Login</option>
                <option value="USER_CREATED">User Created</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
              >
                <option value="">All Types</option>
                <option value="CASE">Case</option>
                <option value="FILE">File</option>
                <option value="USER">User</option>
                <option value="FIRM">Firm</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white border border-gray-300">
          <div className="px-4 py-3 border-b border-gray-300">
            <h2 className="text-sm font-bold text-gray-900">AUDIT TRAIL</h2>
            <p className="text-xs text-gray-600 mt-1">
              {pagination.total} total logs • Page {pagination.page} of {pagination.pages}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-600">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-600">No logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">TIMESTAMP</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">USER</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ROLE</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ACTION</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ENTITY TYPE</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ENTITY ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">IP ADDRESS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {log.user.firstName} {log.user.lastName}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {log.user.role}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {log.entityType}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 font-mono">
                        {log.entityId.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-300 flex items-center justify-between">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Notice */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-300">
          <p className="text-xs text-gray-600">
            Audit logs are immutable and cannot be deleted. Every action is tracked permanently.
          </p>
        </div>
      </div>
    </div>
  );
}

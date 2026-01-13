import React, { useState, useEffect } from 'react';
import { Clock, Filter, Download } from 'lucide-react';
import { LoadingTable } from '../../components/ui/LoadingState';
import { EmptyAuditLogs } from '../../components/ui/EmptyState';
import { showError } from '../../components/ui/Toast';
import { ExportButtons } from '../../components/ExportButtons';

// ============================================
// IMPROVED AUDIT LOGS PAGE
// Better UI, filters, loading, export
// ============================================

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('startDate', filters.dateFrom);
      if (filters.dateTo) params.append('endDate', filters.dateTo);

      const response = await fetch(`/api/audit?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load logs');

      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Load logs error:', error);
      showError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      userId: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'text-green-600';
    if (action.includes('DELETED')) return 'text-red-600';
    if (action.includes('UPDATED')) return 'text-blue-600';
    if (action.includes('FINALIZED')) return 'text-purple-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-600 mt-1">
              {loading ? 'Loading...' : `${logs.length} log${logs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <ExportButtons type="audit-logs" filters={filters} />
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-black text-white text-xs rounded-full">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="bg-gray-50 border border-gray-300 p-4 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">All Actions</option>
                  <option value="CASE_CREATED">Case Created</option>
                  <option value="CASE_UPDATED">Case Updated</option>
                  <option value="CASE_FINALIZED">Case Finalized</option>
                  <option value="FILE_UPLOADED">File Uploaded</option>
                  <option value="FILE_DOWNLOADED">File Downloaded</option>
                  <option value="USER_LOGIN">User Login</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Entity Type
                </label>
                <select
                  value={filters.entityType}
                  onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">All Types</option>
                  <option value="CASE">Case</option>
                  <option value="FILE">File</option>
                  <option value="USER">User</option>
                  <option value="BUNDLE">Bundle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          )}
        </div>

        {/* Logs Table */}
        {loading ? (
          <LoadingTable rows={15} />
        ) : logs.length === 0 ? (
          <EmptyAuditLogs />
        ) : (
          <div className="bg-white border border-gray-300">
            {/* Table Header */}
            <div className="border-b border-gray-300 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-gray-700">
                <div className="col-span-3">TIMESTAMP</div>
                <div className="col-span-2">USER</div>
                <div className="col-span-3">ACTION</div>
                <div className="col-span-2">ENTITY</div>
                <div className="col-span-2">IP ADDRESS</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">
                      {log.user.firstName} {log.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{log.user.role}</p>
                  </div>

                  <div className="col-span-3">
                    <p className={`text-sm font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </p>
                    {log.details && (
                      <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{log.entityType}</p>
                    {log.entityId && (
                      <p className="text-xs text-gray-500 font-mono">
                        {log.entityId.substring(0, 8)}...
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-900 font-mono">
                      {log.ipAddress || '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer */}
            <div className="border-t border-gray-300 bg-gray-50 p-4">
              <p className="text-xs text-gray-600 text-center">
                Showing {logs.length} log{logs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

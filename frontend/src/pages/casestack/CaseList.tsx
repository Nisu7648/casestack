import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Download } from 'lucide-react';
import { LoadingTable } from '../../components/ui/LoadingState';
import { EmptyNoCases, EmptySearchResults } from '../../components/ui/EmptyState';
import { showError, showSuccess } from '../../components/ui/Toast';
import { ExportButtons } from '../../components/ExportButtons';

// ============================================
// IMPROVED CASE LIST
// Better UI, filters, loading, empty states, export
// ============================================

interface Case {
  id: string;
  caseNumber: string;
  client: { id: string; name: string; industry?: string };
  fiscalYear: number;
  caseType: string;
  status: string;
  preparedBy?: { firstName: string; lastName: string };
  reviewedBy?: { firstName: string; lastName: string };
  createdAt: string;
  finalizedAt?: string;
}

export default function CaseList() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    fiscalYear: '',
    caseType: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCases();
  }, [filters]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.fiscalYear) params.append('fiscalYear', filters.fiscalYear);
      if (filters.caseType) params.append('caseType', filters.caseType);

      const response = await fetch(`/api/cases?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load cases');

      const data = await response.json();
      
      // Apply search filter client-side
      let filteredCases = data.cases;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCases = filteredCases.filter((c: Case) =>
          c.caseNumber.toLowerCase().includes(searchLower) ||
          c.client.name.toLowerCase().includes(searchLower)
        );
      }

      setCases(filteredCases);
    } catch (error) {
      console.error('Load cases error:', error);
      showError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FINALIZED':
        return 'bg-green-100 text-green-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      fiscalYear: '',
      caseType: '',
      search: ''
    });
  };

  const hasActiveFilters = filters.status || filters.fiscalYear || filters.caseType || filters.search;
  const isSearching = filters.search.length > 0;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
            <p className="text-sm text-gray-600 mt-1">
              {loading ? 'Loading...' : `${cases.length} case${cases.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons type="cases" filters={filters} />
            <Link
              to="/cases/new"
              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Case
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by case number or client name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-black text-white text-xs rounded-full">
                  {[filters.status, filters.fiscalYear, filters.caseType].filter(Boolean).length}
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

          {/* Filter Options */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-300 p-4 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="FINALIZED">Finalized</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fiscal Year
                </label>
                <select
                  value={filters.fiscalYear}
                  onChange={(e) => setFilters({ ...filters, fiscalYear: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">All Years</option>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Case Type
                </label>
                <select
                  value={filters.caseType}
                  onChange={(e) => setFilters({ ...filters, caseType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">All Types</option>
                  <option value="TAX_AUDIT">Tax Audit</option>
                  <option value="FINANCIAL_AUDIT">Financial Audit</option>
                  <option value="COMPLIANCE">Compliance</option>
                  <option value="ADVISORY">Advisory</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Cases Table */}
        {loading ? (
          <LoadingTable rows={10} />
        ) : cases.length === 0 ? (
          isSearching || hasActiveFilters ? (
            <EmptySearchResults />
          ) : (
            <EmptyNoCases onCreate={() => window.location.href = '/cases/new'} />
          )
        ) : (
          <div className="bg-white border border-gray-300">
            {/* Table Header */}
            <div className="border-b border-gray-300 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-gray-700">
                <div className="col-span-2">CASE NUMBER</div>
                <div className="col-span-3">CLIENT</div>
                <div className="col-span-1">FY</div>
                <div className="col-span-2">TYPE</div>
                <div className="col-span-2">STATUS</div>
                <div className="col-span-2">PREPARED BY</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {cases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  to={`/cases/${caseItem.id}`}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-900">
                      {caseItem.caseNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(caseItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="col-span-3">
                    <p className="text-sm text-gray-900">{caseItem.client.name}</p>
                    {caseItem.client.industry && (
                      <p className="text-xs text-gray-500">{caseItem.client.industry}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <p className="text-sm text-gray-900">{caseItem.fiscalYear}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{caseItem.caseType}</p>
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                  </div>

                  <div className="col-span-2">
                    {caseItem.preparedBy ? (
                      <p className="text-sm text-gray-900">
                        {caseItem.preparedBy.firstName} {caseItem.preparedBy.lastName}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">-</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Table Footer */}
            <div className="border-t border-gray-300 bg-gray-50 p-4">
              <p className="text-xs text-gray-600 text-center">
                Showing {cases.length} case{cases.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

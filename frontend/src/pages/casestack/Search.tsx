import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { LoadingTable } from '../../components/ui/LoadingState';
import { EmptySearchResults } from '../../components/ui/EmptyState';
import { showError, showSuccess } from '../../components/ui/Toast';
import { ExportButtons } from '../../components/ExportButtons';

// ============================================
// IMPROVED SEARCH PAGE
// Better UI, loading states, export
// ============================================

export default function Search() {
  const [searchParams, setSearchParams] = useState({
    caseNumber: '',
    clientName: '',
    fiscalYear: '',
    caseType: '',
    status: '',
    preparedBy: '',
    dateFrom: '',
    dateTo: ''
  });
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    setSearched(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/search/advanced?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setResults(data.results);
      showSuccess(`Found ${data.results.length} result${data.results.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Search error:', error);
      showError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchParams({
      caseNumber: '',
      clientName: '',
      fiscalYear: '',
      caseType: '',
      status: '',
      preparedBy: '',
      dateFrom: '',
      dateTo: ''
    });
    setResults([]);
    setSearched(false);
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

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Search</h1>
            <p className="text-sm text-gray-600 mt-1">
              Search cases by multiple criteria
            </p>
          </div>
          {results.length > 0 && (
            <ExportButtons type="cases" filters={searchParams} />
          )}
        </div>

        {/* Search Form */}
        <div className="bg-white border border-gray-300 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Case Number
              </label>
              <input
                type="text"
                value={searchParams.caseNumber}
                onChange={(e) => setSearchParams({ ...searchParams, caseNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., TAX-2024-001"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={searchParams.clientName}
                onChange={(e) => setSearchParams({ ...searchParams, clientName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., ABC Corp"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fiscal Year
              </label>
              <select
                value={searchParams.fiscalYear}
                onChange={(e) => setSearchParams({ ...searchParams, fiscalYear: e.target.value })}
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
                value={searchParams.caseType}
                onChange={(e) => setSearchParams({ ...searchParams, caseType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">All Types</option>
                <option value="TAX_AUDIT">Tax Audit</option>
                <option value="FINANCIAL_AUDIT">Financial Audit</option>
                <option value="COMPLIANCE">Compliance</option>
                <option value="ADVISORY">Advisory</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={searchParams.status}
                onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })}
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
                Prepared By
              </label>
              <input
                type="text"
                value={searchParams.preparedBy}
                onChange={(e) => setSearchParams({ ...searchParams, preparedBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="User name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={searchParams.dateFrom}
                onChange={(e) => setSearchParams({ ...searchParams, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={searchParams.dateTo}
                onChange={(e) => setSearchParams({ ...searchParams, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <SearchIcon className="w-4 h-4" />
              {searching ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={clearSearch}
              className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results */}
        {searching ? (
          <LoadingTable rows={5} />
        ) : searched && results.length === 0 ? (
          <EmptySearchResults />
        ) : results.length > 0 ? (
          <div className="bg-white border border-gray-300">
            {/* Header */}
            <div className="border-b border-gray-300 bg-gray-50 p-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Search Results ({results.length})
              </h2>
            </div>

            {/* Results List */}
            <div className="divide-y divide-gray-200">
              {results.map((result: any) => (
                <Link
                  key={result.id}
                  to={`/cases/${result.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-900">
                          {result.caseNumber}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {result.client?.name} • FY {result.fiscalYear} • {result.caseType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(result.createdAt).toLocaleDateString()}
                      </p>
                      {result.preparedBy && (
                        <p className="text-xs text-gray-500">
                          by {result.preparedBy.firstName} {result.preparedBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

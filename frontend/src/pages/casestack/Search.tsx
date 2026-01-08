import React, { useState } from 'react';
import { Search as SearchIcon, Filter, Download } from 'lucide-react';

// ============================================
// 5️⃣ SEARCH & FIRM MEMORY SCREEN
// Fast, boring, institutional memory
// ============================================

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    clientName: '',
    caseType: '',
    fiscalYear: '',
    partnerName: ''
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !filters.clientName && !filters.caseType && !filters.fiscalYear && !filters.partnerName) {
      alert('Please enter a search query or filter');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const token = localStorage.getItem('token');
      
      // Use advanced search if filters are set
      if (filters.clientName || filters.caseType || filters.fiscalYear || filters.partnerName) {
        const response = await fetch('/api/search/advanced', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            caseName: searchQuery,
            ...filters
          })
        });
        const data = await response.json();
        setResults(data.results || []);
      } else {
        // Simple search
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/search/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filters })
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casestack-search-${Date.now()}.csv`;
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Search Cases</h1>
          <p className="text-sm text-gray-600 mt-1">Search across all finalized cases. Even ex-employees' cases remain visible.</p>
        </div>

        {/* Search Box */}
        <div className="bg-white border border-gray-300 p-6 mb-4">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
                placeholder="Search by case name, client name, case number..."
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2.5 bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Advanced Filters */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">ADVANCED FILTERS</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  type="text"
                  value={filters.clientName}
                  onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
                  placeholder="Client..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Case Type</label>
                <select
                  value={filters.caseType}
                  onChange={(e) => setFilters({ ...filters, caseType: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
                >
                  <option value="">All Types</option>
                  <option value="AUDIT">Audit</option>
                  <option value="CONSULTING">Consulting</option>
                  <option value="TAX">Tax</option>
                  <option value="ADVISORY">Advisory</option>
                  <option value="DUE_DILIGENCE">Due Diligence</option>
                  <option value="RISK_ASSESSMENT">Risk Assessment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fiscal Year</label>
                <select
                  value={filters.fiscalYear}
                  onChange={(e) => setFilters({ ...filters, fiscalYear: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
                >
                  <option value="">All Years</option>
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Partner Name</label>
                <input
                  type="text"
                  value={filters.partnerName}
                  onChange={(e) => setFilters({ ...filters, partnerName: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
                  placeholder="Partner..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="bg-white border border-gray-300">
            <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">SEARCH RESULTS</h2>
                <p className="text-xs text-gray-600 mt-1">{results.length} cases found</p>
              </div>
              {results.length > 0 && (
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-gray-600">Searching...</div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-600">No cases found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CASE NUMBER</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CASE NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CLIENT</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">YEAR</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">PARTNER</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">FINALIZED</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result) => (
                      <tr key={result.caseId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{result.caseNumber}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.caseName}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{result.clientName}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{result.caseType}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{result.fiscalYear}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{result.partnerName}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {new Date(result.finalizedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          <a
                            href={`/cases/${result.caseId}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Notice */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-300">
          <p className="text-xs text-gray-600">
            Search is fast and boring. Historical data persists even if employees leave.
          </p>
        </div>
      </div>
    </div>
  );
}

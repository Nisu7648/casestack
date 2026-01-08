import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Lock, Search, Filter } from 'lucide-react';

// ============================================
// 3️⃣ CASE LIST SCREEN (CORE DAILY VIEW)
// Table-based, dense, no inline editing
// ============================================

export default function CaseList() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    caseType: '',
    fiscalYear: '',
    search: ''
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadCases();
  }, [filters]);

  const loadCases = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.caseType) params.append('caseType', filters.caseType);
      if (filters.fiscalYear) params.append('fiscalYear', filters.fiscalYear);

      const response = await fetch(`/api/cases?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      let filteredCases = data.cases;
      
      // Client-side search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCases = filteredCases.filter((c: any) =>
          c.caseName.toLowerCase().includes(searchLower) ||
          c.client.name.toLowerCase().includes(searchLower) ||
          c.caseNumber.toLowerCase().includes(searchLower)
        );
      }
      
      setCases(filteredCases);
    } catch (error) {
      console.error('Load cases error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FINALIZED':
        return 'bg-gray-100 text-gray-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-50 text-blue-800';
      case 'DRAFT':
        return 'bg-yellow-50 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCreateCase = user?.role !== 'PARTNER'; // Consultants and Managers can create

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Cases</h1>
            <p className="text-sm text-gray-600 mt-1">{cases.length} cases</p>
          </div>
          {canCreateCase && (
            <button
              onClick={() => navigate('/cases/new')}
              className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Case
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-300 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">FILTERS</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
                  placeholder="Case name, client..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="FINALIZED">Finalized</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
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
                {[2024, 2023, 2022, 2021, 2020].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white border border-gray-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CASE NUMBER</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CASE NAME</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CLIENT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">TYPE</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">YEAR</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">OWNER</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">STATUS</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">PARTNER</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">LAST UPDATED</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-600">
                      Loading cases...
                    </td>
                  </tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-600">
                      No cases found
                    </td>
                  </tr>
                ) : (
                  cases.map((caseItem) => (
                    <tr key={caseItem.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {caseItem.caseNumber}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {caseItem.caseName}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {caseItem.client.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {caseItem.caseType}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {caseItem.fiscalYear}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {caseItem.preparedBy.firstName} {caseItem.preparedBy.lastName}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status === 'FINALIZED' && <Lock className="w-3 h-3" />}
                          {caseItem.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {caseItem.approvedBy 
                          ? `${caseItem.approvedBy.firstName} ${caseItem.approvedBy.lastName}`
                          : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {new Date(caseItem.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          to={`/cases/${caseItem.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rules Notice */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-300">
          <p className="text-xs text-gray-600">
            No inline editing. Status color-coded. Finalized cases clearly marked 🔒
          </p>
        </div>
      </div>
    </div>
  );
}

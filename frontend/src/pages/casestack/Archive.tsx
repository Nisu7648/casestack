import React, { useState, useEffect } from 'react';
import { Lock, Download, FileText } from 'lucide-react';

// ============================================
// 6️⃣ ARCHIVE SCREEN
// Only finalized cases, sorted by year
// This is where firms feel safe
// ============================================

export default function Archive() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    loadArchive();
  }, [selectedYear]);

  const loadArchive = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('status', 'FINALIZED');
      if (selectedYear) {
        params.append('fiscalYear', selectedYear);
      }

      const response = await fetch(`/api/cases?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Sort by finalized date descending
      const sortedCases = data.cases.sort((a: any, b: any) => 
        new Date(b.finalizedAt).getTime() - new Date(a.finalizedAt).getTime()
      );
      
      setCases(sortedCases);

      // Extract unique years
      const uniqueYears = [...new Set(sortedCases.map((c: any) => c.fiscalYear))].sort((a, b) => b - a);
      setYears(uniqueYears as number[]);
    } catch (error) {
      console.error('Load archive error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (!confirm(`Download all ${cases.length} finalized cases?`)) return;

    try {
      const token = localStorage.getItem('token');
      // In production, this would trigger a bulk export
      alert('Bulk download initiated. This would generate a ZIP file with all cases.');
    } catch (error) {
      console.error('Bulk download error:', error);
      alert('Bulk download failed');
    }
  };

  const groupByYear = () => {
    const grouped: { [key: number]: any[] } = {};
    cases.forEach(caseItem => {
      if (!grouped[caseItem.fiscalYear]) {
        grouped[caseItem.fiscalYear] = [];
      }
      grouped[caseItem.fiscalYear].push(caseItem);
    });
    return grouped;
  };

  const groupedCases = groupByYear();
  const sortedYears = Object.keys(groupedCases).map(Number).sort((a, b) => b - a);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finalized Archive</h1>
            <p className="text-sm text-gray-600 mt-1">
              {cases.length} finalized cases • This is where firms feel safe
            </p>
          </div>
          {cases.length > 0 && (
            <button
              onClick={handleBulkDownload}
              className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 text-sm font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Bulk Download
            </button>
          )}
        </div>

        {/* Year Filter */}
        <div className="bg-white border border-gray-300 p-4 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-700">FILTER BY YEAR:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cases by Year */}
        {loading ? (
          <div className="bg-white border border-gray-300 p-8 text-center">
            <p className="text-sm text-gray-600">Loading archive...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="bg-white border border-gray-300 p-8 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No finalized cases yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedYears.map(year => (
              <div key={year} className="bg-white border border-gray-300">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-300">
                  <h2 className="text-sm font-bold text-gray-900">
                    FISCAL YEAR {year}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    {groupedCases[year].length} cases
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CASE NUMBER</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CASE NAME</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CLIENT</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">TYPE</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">PARTNER</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">FINALIZED</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">BUNDLES</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupedCases[year].map((caseItem: any) => (
                        <tr key={caseItem.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <Lock className="w-3 h-3 text-gray-600" />
                              {caseItem.caseNumber}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{caseItem.caseName}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{caseItem.client.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{caseItem.caseType}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {caseItem.approvedBy 
                              ? `${caseItem.approvedBy.firstName} ${caseItem.approvedBy.lastName}`
                              : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(caseItem.finalizedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {caseItem.bundles?.length || 0}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <a
                                href={`/cases/${caseItem.id}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View
                              </a>
                              <span className="text-gray-300">|</span>
                              <button className="text-sm text-blue-600 hover:underline">
                                Export
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notice */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-300">
          <p className="text-xs text-gray-600">
            Only finalized cases shown. Sorted by year (descending). Bulk download allowed (role-based).
          </p>
        </div>
      </div>
    </div>
  );
}

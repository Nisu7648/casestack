import React, { useState } from 'react';
import { Search, FileText, Building2, Link as LinkIcon, Calendar } from 'lucide-react';

// ============================================
// GLOBAL SEARCH - Screen 9
// Fast search across all entities
// ============================================

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'clients' | 'engagements' | 'reports' | 'evidence'>('all');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      alert('Please enter at least 2 characters');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'All Results', count: results ? Object.values(results).flat().length : 0 },
    { key: 'clients', label: 'Clients', count: results?.clients?.length || 0 },
    { key: 'engagements', label: 'Engagements', count: results?.engagements?.length || 0 },
    { key: 'reports', label: 'Reports', count: results?.reports?.length || 0 },
    { key: 'evidence', label: 'Evidence', count: results?.evidence?.length || 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Global Search</h1>
          
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, engagements, reports, evidence..."
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
        </div>

        {results && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {(activeTab === 'all' || activeTab === 'clients') && results.clients?.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Clients ({results.clients.length})
                  </h2>
                  <div className="space-y-2">
                    {results.clients.map((client: any) => (
                      <div key={client.id} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.industry}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'engagements') && results.engagements?.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Engagements ({results.engagements.length})
                  </h2>
                  <div className="space-y-2">
                    {results.engagements.map((engagement: any) => (
                      <div key={engagement.id} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <p className="font-medium text-gray-900">
                          {engagement.client.name} - {engagement.type}
                        </p>
                        <p className="text-sm text-gray-500">Year: {engagement.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'reports') && results.reports?.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Reports ({results.reports.length})
                  </h2>
                  <div className="space-y-2">
                    {results.reports.map((report: any) => (
                      <div key={report.id} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <p className="font-medium text-gray-900">
                          {report.engagement.client.name}
                        </p>
                        <p className="text-sm text-gray-500">Status: {report.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'evidence') && results.evidence?.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Evidence ({results.evidence.length})
                  </h2>
                  <div className="space-y-2">
                    {results.evidence.map((item: any) => (
                      <div key={item.id} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <p className="font-medium text-gray-900">{item.fileName}</p>
                        <p className="text-sm text-gray-500">{item.sourceSystem}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        )}

        {!results && !loading && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Enter a search query to find clients, engagements, reports, and evidence</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, User, Calendar } from 'lucide-react';

// ============================================
// CLIENT LIST - Screen 1
// Table view with all clients
// ============================================

interface Client {
  id: string;
  name: string;
  industry: string;
  leadPartner: {
    firstName: string;
    lastName: string;
  };
  totalEngagements: number;
  lastEngagementYear: number | null;
  createdAt: string;
}

export default function ClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'industry' | 'engagements'>('name');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
      alert('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients
    .filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'industry') return a.industry.localeCompare(b.industry);
      if (sortBy === 'engagements') return b.totalEngagements - a.totalEngagements;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
              <p className="text-gray-600 mt-1">Manage your client relationships and engagements</p>
            </div>
            <button
              onClick={() => navigate('/clients/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Client
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search clients by name or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="industry">Sort by Industry</option>
              <option value="engagements">Sort by Engagements</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client Table */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first client'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/clients/new')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add First Client
                </button>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Engagements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Engagement
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {client.industry}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {client.leadPartner.firstName} {client.leadPartner.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{client.totalEngagements}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.lastEngagementYear ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{client.lastEngagementYear}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No engagements</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients/${client.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Clients</p>
                <p className="text-2xl font-semibold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Engagements</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {clients.reduce((sum, c) => sum + c.totalEngagements, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active This Year</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {clients.filter(c => c.lastEngagementYear === new Date().getFullYear()).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, FileText, Plus, ExternalLink } from 'lucide-react';

// ============================================
// CLIENT DETAIL - Screen 2 (KEY SCREEN)
// Deep dive with full engagement history
// ============================================

interface Engagement {
  id: string;
  year: number;
  type: string;
  status: string;
  leadPartner: {
    firstName: string;
    lastName: string;
  };
  finalizedAt: string | null;
  report: {
    id: string;
    status: string;
    isLocked: boolean;
  } | null;
}

interface Client {
  id: string;
  name: string;
  industry: string;
  leadPartner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  engagements: Engagement[];
  createdAt: string;
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/clients/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setClient(data.client);
    } catch (error) {
      console.error('Failed to load client:', error);
      alert('Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      IN_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      FINALIZED: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Client not found</h3>
          <button
            onClick={() => navigate('/clients')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                <p className="text-gray-600 mt-1">{client.industry}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <User className="w-4 h-4 mr-1" />
                  Lead Partner: {client.leadPartner.firstName} {client.leadPartner.lastName}
                  <span className="mx-2">•</span>
                  <span>{client.leadPartner.role}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/engagements/new?clientId=${client.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Engagement
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Total Engagements</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{client.engagements.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Active</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {client.engagements.filter(e => e.status === 'IN_PROGRESS').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Finalized</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {client.engagements.filter(e => e.status === 'FINALIZED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Years Active</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {new Set(client.engagements.map(e => e.year)).size}
            </p>
          </div>
        </div>

        {/* Engagement History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Engagement History</h2>
            <p className="text-sm text-gray-500 mt-1">Complete timeline of all engagements</p>
          </div>

          {client.engagements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No engagements yet</h3>
              <p className="text-gray-500 mb-4">Create the first engagement for this client</p>
              <button
                onClick={() => navigate(`/engagements/new?clientId=${client.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Engagement
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Finalized
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {client.engagements.map((engagement) => (
                    <tr key={engagement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{engagement.year}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{engagement.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(engagement.status)}`}>
                          {engagement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {engagement.leadPartner.firstName} {engagement.leadPartner.lastName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {engagement.report ? (
                          <div className="flex items-center">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(engagement.report.status)}`}>
                              {engagement.report.status}
                            </span>
                            {engagement.report.isLocked && (
                              <span className="ml-2 text-xs text-gray-500">🔒 Locked</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No report</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {engagement.finalizedAt ? (
                          <span className="text-sm text-gray-900">
                            {new Date(engagement.finalizedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Not finalized</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/engagements/${engagement.id}`)}
                          className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1"
                        >
                          View
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Timeline View */}
        {client.engagements.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Timeline</h3>
            <div className="space-y-4">
              {client.engagements
                .sort((a, b) => b.year - a.year)
                .map((engagement, index) => (
                  <div key={engagement.id} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        engagement.status === 'FINALIZED' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          engagement.status === 'FINALIZED' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {engagement.year} - {engagement.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            Led by {engagement.leadPartner.firstName} {engagement.leadPartner.lastName}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(engagement.status)}`}>
                          {engagement.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

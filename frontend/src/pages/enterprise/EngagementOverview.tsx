import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Link as LinkIcon, Calendar, User, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================
// ENGAGEMENT OVERVIEW - Screen 4
// High-trust summary dashboard
// ============================================

interface Engagement {
  id: string;
  year: number;
  type: string;
  status: string;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    industry: string;
  };
  leadPartner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  managers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  report: {
    id: string;
    status: string;
    isLocked: boolean;
    sections: Array<{
      id: string;
      type: string;
      isLocked: boolean;
      updatedAt: string;
    }>;
    comments: Array<{ id: string }>;
  } | null;
  evidence: Array<{
    id: string;
    fileName: string;
    sourceSystem: string;
    createdAt: string;
  }>;
}

export default function EngagementOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEngagement();
  }, [id]);

  const loadEngagement = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/engagements/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setEngagement(data.engagement);
    } catch (error) {
      console.error('Failed to load engagement:', error);
      alert('Failed to load engagement');
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
          <p className="mt-4 text-gray-600">Loading engagement...</p>
        </div>
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Engagement not found</h3>
          <button
            onClick={() => navigate('/engagements')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Engagements
          </button>
        </div>
      </div>
    );
  }

  const unresolvedComments = engagement.report?.comments.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate(`/clients/${engagement.client.id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {engagement.client.name}
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {engagement.client.name} - {engagement.type}
                </h1>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(engagement.status)}`}>
                  {engagement.status}
                </span>
              </div>
              <p className="text-gray-600">Year: {engagement.year}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/engagements/${engagement.id}/report`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Open Report Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Report Status</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {engagement.report?.status || 'No Report'}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Evidence Files</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {engagement.evidence.length}
                </p>
              </div>
              <LinkIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Unresolved Comments</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {unresolvedComments}
                </p>
              </div>
              {unresolvedComments > 0 ? (
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Team Members</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {1 + engagement.managers.length}
                </p>
              </div>
              <User className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Team Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Team</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Lead Partner</p>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {engagement.leadPartner.firstName} {engagement.leadPartner.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{engagement.leadPartner.email}</p>
                  </div>
                </div>
              </div>

              {engagement.managers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Managers</p>
                  <div className="space-y-2">
                    {engagement.managers.map(manager => (
                      <div key={manager.id} className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {manager.firstName} {manager.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{manager.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Timeline</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-500">
                    {new Date(engagement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Updated</p>
                  <p className="text-sm text-gray-500">
                    {new Date(engagement.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {engagement.finalizedAt && (
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Finalized</p>
                    <p className="text-sm text-gray-500">
                      {new Date(engagement.finalizedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => navigate(`/engagements/${engagement.id}/report`)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <FileText className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Open Report Workspace</p>
              <p className="text-sm text-gray-500 mt-1">Edit report sections and review comments</p>
            </button>

            <button
              onClick={() => navigate(`/engagements/${engagement.id}/evidence`)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
            >
              <LinkIcon className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">View Evidence</p>
              <p className="text-sm text-gray-500 mt-1">Manage supporting documents and references</p>
            </button>

            <button
              onClick={() => navigate(`/audit?entityId=${engagement.id}`)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
            >
              <Calendar className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">View Audit Trail</p>
              <p className="text-sm text-gray-500 mt-1">See all activity and changes</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

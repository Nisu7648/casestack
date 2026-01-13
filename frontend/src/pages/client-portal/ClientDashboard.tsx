import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, CheckCircle, Clock, Download, Send } from 'lucide-react';
import { showSuccess, showError } from '../../components/ui/Toast';

// ============================================
// CLIENT PORTAL DASHBOARD
// Better than Clio: Real-time updates, mobile-friendly, clean UI
// ============================================

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('clientToken');
      const response = await fetch('/api/client-portal/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load dashboard');

      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Load dashboard error:', error);
      showError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    navigate('/client-portal/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Client Portal</h1>
            <p className="text-sm text-gray-600">
              Welcome, {dashboard?.client?.name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {dashboard?.stats?.totalCases || 0}
            </p>
            <p className="text-sm text-gray-600">Total Cases</p>
          </div>

          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {dashboard?.stats?.activeCases || 0}
            </p>
            <p className="text-sm text-gray-600">Active Cases</p>
          </div>

          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {dashboard?.stats?.finalizedCases || 0}
            </p>
            <p className="text-sm text-gray-600">Finalized</p>
          </div>

          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {dashboard?.stats?.unreadMessages || 0}
            </p>
            <p className="text-sm text-gray-600">Unread Messages</p>
          </div>
        </div>

        {/* Recent Cases */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Cases</h2>
          </div>

          {dashboard?.recentCases?.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No cases yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {dashboard?.recentCases?.map((caseItem: any) => (
                <div
                  key={caseItem.id}
                  onClick={() => navigate(`/client-portal/cases/${caseItem.id}`)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {caseItem.caseNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {caseItem.caseType} • FY {caseItem.fiscalYear}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-gray-500">
                        {new Date(caseItem.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-300 p-4 text-center">
            <button
              onClick={() => navigate('/client-portal/cases')}
              className="text-sm text-blue-600 hover:underline"
            >
              View all cases →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'IN_REVIEW':
      return 'bg-yellow-100 text-yellow-800';
    case 'PARTNER_REVIEW':
      return 'bg-blue-100 text-blue-800';
    case 'FINALIZED':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

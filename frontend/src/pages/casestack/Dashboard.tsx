import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Lock, Clock, AlertTriangle, TrendingUp, Download } from 'lucide-react';
import { LoadingDashboard } from '../../components/ui/LoadingState';
import { EmptyNoCases } from '../../components/ui/EmptyState';
import { showError } from '../../components/ui/Toast';

// ============================================
// IMPROVED DASHBOARD
// Better UI, loading states, empty states
// ============================================

interface DashboardStats {
  totalActiveCases: number;
  finalizedCasesThisYear: number;
  pendingReviews: number;
  awaitingPartnerApproval: number;
  recentCases: any[];
  monthlyTrend: {
    created: number;
    finalized: number;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const casesResponse = await fetch('/api/cases', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!casesResponse.ok) throw new Error('Failed to load dashboard');
      
      const casesData = await casesResponse.json();
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      const stats: DashboardStats = {
        totalActiveCases: casesData.cases.filter((c: any) => c.status !== 'FINALIZED').length,
        finalizedCasesThisYear: casesData.cases.filter((c: any) => 
          c.status === 'FINALIZED' && 
          new Date(c.finalizedAt).getFullYear() === currentYear
        ).length,
        pendingReviews: casesData.cases.filter((c: any) => c.status === 'UNDER_REVIEW').length,
        awaitingPartnerApproval: casesData.cases.filter((c: any) => 
          c.status === 'UNDER_REVIEW' && c.reviewedById
        ).length,
        recentCases: casesData.cases.slice(0, 10),
        monthlyTrend: {
          created: casesData.cases.filter((c: any) => 
            new Date(c.createdAt).getMonth() === currentMonth
          ).length,
          finalized: casesData.cases.filter((c: any) => 
            c.finalizedAt && new Date(c.finalizedAt).getMonth() === currentMonth
          ).length
        }
      };

      setStats(stats);
    } catch (error) {
      console.error('Load dashboard error:', error);
      showError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingDashboard />;
  }

  const isPartner = user?.role === 'PARTNER' || user?.role === 'ADMIN';
  const hasNoCases = stats && stats.totalActiveCases === 0 && stats.finalizedCasesThisYear === 0;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Firm Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">{user?.firmName}</p>
          </div>
          <Link
            to="/cases/new"
            className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Create Case
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Active Cases */}
          <div className="bg-white border border-gray-300 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <p className="text-xs font-medium text-gray-600">ACTIVE CASES</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalActiveCases || 0}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.monthlyTrend.created || 0} created this month
            </p>
          </div>

          {/* Finalized Cases */}
          <div className="bg-white border border-gray-300 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-gray-600" />
              <p className="text-xs font-medium text-gray-600">FINALIZED (THIS YEAR)</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.finalizedCasesThisYear || 0}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.monthlyTrend.finalized || 0} this month
            </p>
          </div>

          {/* Pending Reviews */}
          <div className="bg-white border border-gray-300 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <p className="text-xs font-medium text-gray-600">PENDING REVIEWS</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.pendingReviews || 0}</p>
            {stats && stats.pendingReviews > 0 && (
              <Link to="/cases?status=UNDER_REVIEW" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                View all →
              </Link>
            )}
          </div>

          {/* Partner Approval */}
          {isPartner && (
            <div className="bg-white border border-gray-300 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">AWAITING APPROVAL</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats?.awaitingPartnerApproval || 0}</p>
              {stats && stats.awaitingPartnerApproval > 0 && (
                <Link to="/cases?needsApproval=true" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  Review now →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent Cases */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 p-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">RECENT CASES</h2>
            <Link to="/cases" className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>

          {hasNoCases ? (
            <EmptyNoCases onCreate={() => window.location.href = '/cases/new'} />
          ) : (
            <div className="divide-y divide-gray-200">
              {stats?.recentCases.map((caseItem: any) => (
                <Link
                  key={caseItem.id}
                  to={`/cases/${caseItem.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-900">
                          {caseItem.caseNumber}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-medium ${
                          caseItem.status === 'FINALIZED' ? 'bg-green-100 text-green-800' :
                          caseItem.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {caseItem.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {caseItem.client?.name} • FY {caseItem.fiscalYear} • {caseItem.caseType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </p>
                      {caseItem.preparedBy && (
                        <p className="text-xs text-gray-500">
                          by {caseItem.preparedBy.firstName} {caseItem.preparedBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Link
            to="/search"
            className="bg-white border border-gray-300 p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Advanced Search</h3>
            <p className="text-xs text-gray-600">Search cases by multiple criteria</p>
          </Link>

          <Link
            to="/archive"
            className="bg-white border border-gray-300 p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Archive</h3>
            <p className="text-xs text-gray-600">View finalized cases</p>
          </Link>

          <Link
            to="/audit-logs"
            className="bg-white border border-gray-300 p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Audit Logs</h3>
            <p className="text-xs text-gray-600">Complete activity trail</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

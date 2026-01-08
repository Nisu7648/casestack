import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Lock, Clock, AlertTriangle } from 'lucide-react';

// ============================================
// 2️⃣ MAIN DASHBOARD (FIRM OVERVIEW)
// Dense information, role-based visibility
// ============================================

interface DashboardStats {
  totalActiveCases: number;
  finalizedCasesThisYear: number;
  pendingReviews: number;
  awaitingPartnerApproval: number;
  recentCases: any[];
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
      
      // Get cases
      const casesResponse = await fetch('/api/cases', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const casesData = await casesResponse.json();

      const currentYear = new Date().getFullYear();
      
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
        recentCases: casesData.cases.slice(0, 10)
      };

      setStats(stats);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    );
  }

  const isPartner = user?.role === 'PARTNER' || user?.role === 'ADMIN';

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Firm Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">{user?.firmName}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <p className="text-xs font-medium text-gray-600">ACTIVE CASES</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalActiveCases || 0}</p>
          </div>

          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-gray-600" />
              <p className="text-xs font-medium text-gray-600">FINALIZED (THIS YEAR)</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.finalizedCasesThisYear || 0}</p>
          </div>

          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <p className="text-xs font-medium text-gray-600">PENDING REVIEWS</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.pendingReviews || 0}</p>
          </div>

          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-gray-600" />
              <p className="text-xs font-medium text-gray-600">AWAITING PARTNER</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.awaitingPartnerApproval || 0}</p>
          </div>
        </div>

        {/* Recent Cases */}
        <div className="bg-white border border-gray-300">
          <div className="px-4 py-3 border-b border-gray-300">
            <h2 className="text-sm font-bold text-gray-900">RECENT CASES</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CASE NUMBER</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CASE NAME</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">CLIENT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">STATUS</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">OWNER</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">LAST UPDATED</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.recentCases.map((caseItem: any) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <Link to={`/cases/${caseItem.id}`} className="hover:underline">
                        {caseItem.caseNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{caseItem.caseName}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{caseItem.client.name}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                        caseItem.status === 'FINALIZED' 
                          ? 'bg-gray-100 text-gray-800' 
                          : caseItem.status === 'UNDER_REVIEW'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-yellow-50 text-yellow-800'
                      }`}>
                        {caseItem.status === 'FINALIZED' && <Lock className="w-3 h-3" />}
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {caseItem.preparedBy.firstName} {caseItem.preparedBy.lastName}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(caseItem.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role-based notice */}
        {!isPartner && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-300">
            <p className="text-xs text-gray-600">
              Limited view. Partners see full firm-level statistics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertCircle, Clock, CheckCircle } from 'lucide-react';

// ============================================
// REVIEW DASHBOARD - Screen 6 (Manager/Partner only)
// Central hub for pending reviews
// ============================================

interface PendingReport {
  id: string;
  engagement: {
    id: string;
    client: {
      name: string;
    };
    year: number;
    type: string;
  };
  status: string;
  unresolvedComments: number;
  submittedAt: string;
}

export default function ReviewDashboard() {
  const navigate = useNavigate();
  const [pendingReviews, setPendingReviews] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const loadPendingReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/engagements?status=IN_REVIEW', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      const reviews = data.engagements
        .filter((e: any) => e.report)
        .map((e: any) => ({
          id: e.report.id,
          engagement: {
            id: e.id,
            client: e.client,
            year: e.year,
            type: e.type
          },
          status: e.report.status,
          unresolvedComments: e.report.comments?.length || 0,
          submittedAt: e.updatedAt
        }));
      
      setPendingReviews(reviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Review Dashboard</h1>
          <p className="text-gray-600 mt-1">Reports awaiting your review</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingReviews.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">With Comments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {pendingReviews.filter(r => r.unresolvedComments > 0).length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ready to Approve</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {pendingReviews.filter(r => r.unresolvedComments === 0).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Reviews List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Pending Reviews</h2>
          </div>

          {pendingReviews.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-500">No reports awaiting review</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/engagements/${review.engagement.id}/report`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {review.engagement.client.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {review.engagement.type} - {review.engagement.year}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-500">
                            Submitted {new Date(review.submittedAt).toLocaleDateString()}
                          </span>
                          {review.unresolvedComments > 0 && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {review.unresolvedComments} unresolved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/engagements/${review.engagement.id}/report`);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

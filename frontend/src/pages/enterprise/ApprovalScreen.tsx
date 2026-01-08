import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Lock, FileText } from 'lucide-react';

// ============================================
// APPROVAL SCREEN - Screen 7 (Partner only)
// Ceremonial final sign-off
// ============================================

interface Report {
  id: string;
  status: string;
  isLocked: boolean;
  engagement: {
    id: string;
    client: { name: string };
    year: number;
    type: string;
  };
  sections: Array<{
    type: string;
    content: string;
  }>;
  comments: Array<{
    id: string;
    isResolved: boolean;
  }>;
}

export default function ApprovalScreen() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('This action is irreversible. The report will be locked and finalized. Continue?')) {
      return;
    }

    setApproving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Report approved and finalized successfully!');
        navigate(`/engagements/${report?.engagement.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve report');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve report');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Report not found</p>
      </div>
    );
  }

  const unresolvedComments = report.comments.filter(c => !c.isResolved).length;
  const canApprove = unresolvedComments === 0 && report.status !== 'FINALIZED';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Final Approval</h1>
            <p className="text-sm text-gray-500 mt-1">
              {report.engagement.client.name} - {report.engagement.type} ({report.engagement.year})
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Checks */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {unresolvedComments === 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Comments Status</p>
                  <p className="text-sm text-gray-500">
                    {unresolvedComments === 0 
                      ? 'All comments resolved' 
                      : `${unresolvedComments} unresolved comments`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Report Sections</p>
                  <p className="text-sm text-gray-500">{report.sections.length} sections completed</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {report.isLocked ? (
                  <Lock className="w-6 h-6 text-purple-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Lock Status</p>
                  <p className="text-sm text-gray-500">
                    {report.isLocked ? 'Report is locked' : 'Report will be locked upon approval'}
                  </p>
                </div>
              </div>
            </div>

            {/* Report Preview */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h2>
              <div className="space-y-4">
                {report.sections.map((section) => (
                  <div key={section.type} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{section.type}</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {section.content || 'No content'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            {!canApprove && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Cannot Approve Yet</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {unresolvedComments > 0 && `Resolve ${unresolvedComments} comment(s) before approval.`}
                      {report.status === 'FINALIZED' && 'Report is already finalized.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Action */}
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Warning: Irreversible Action</p>
                    <p className="text-sm text-red-700 mt-1">
                      Once approved, the report will be permanently locked. No further edits will be possible.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!canApprove || approving}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {approving ? 'Approving...' : 'Approve & Lock Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

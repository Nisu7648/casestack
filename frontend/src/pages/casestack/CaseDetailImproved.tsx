import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, FileText, CheckCircle, Clock, Upload, Download, AlertTriangle, X, ArrowLeft } from 'lucide-react';
import { LoadingCaseDetail } from '../../components/ui/LoadingState';
import { EmptyNoFiles } from '../../components/ui/EmptyState';
import { showSuccess, showError, showWarning } from '../../components/ui/Toast';
import { ExportButtons, ShareButton } from '../../components/ExportButtons';

// ============================================
// IMPROVED CASE DETAIL
// Export buttons, better UI, toast notifications
// ============================================

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<any>(null);
  const [bundles, setBundles] = useState<any[]>([]);
  const [approvalChain, setApprovalChain] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Review & Approval state
  const [reviewComment, setReviewComment] = useState('');
  const [finalizeComment, setFinalizeComment] = useState('');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadCaseData();
  }, [id]);

  const loadCaseData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [caseRes, bundlesRes, approvalRes, auditRes] = await Promise.all([
        fetch(`/api/cases/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/bundles/case/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/cases/${id}/approval-chain`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/audit/case/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const [caseData, bundlesData, approvalData, auditData] = await Promise.all([
        caseRes.json(),
        bundlesRes.json(),
        approvalRes.json(),
        auditRes.json()
      ]);

      setCaseData(caseData.case);
      setBundles(bundlesData.bundles);
      setApprovalChain(approvalData.approvalChain);
      setAuditLogs(auditData.logs);
    } catch (error) {
      console.error('Load case error:', error);
      showError('Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!confirm('Submit this case for review? You cannot edit it after submission.')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cases/${id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Submit failed');

      showSuccess('Case submitted for review successfully');
      loadCaseData();
    } catch (error) {
      console.error('Submit error:', error);
      showError('Failed to submit case');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (approved: boolean) => {
    if (!reviewComment.trim()) {
      showWarning('Please add a comment');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cases/${id}/review`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, comments: reviewComment })
      });

      if (!response.ok) throw new Error('Review failed');

      showSuccess(approved ? 'Case approved successfully' : 'Case rejected');
      setReviewComment('');
      loadCaseData();
    } catch (error) {
      console.error('Review error:', error);
      showError('Failed to review case');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalize = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cases/${id}/finalize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalComments: finalizeComment })
      });

      if (!response.ok) throw new Error('Finalize failed');

      showSuccess('✅ Case finalized and locked successfully');
      setShowFinalizeModal(false);
      setFinalizeComment('');
      loadCaseData();
    } catch (error) {
      console.error('Finalize error:', error);
      showError('Failed to finalize case');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingCaseDetail />;
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Case not found</p>
          <button onClick={() => navigate('/cases')} className="mt-4 text-blue-600 hover:underline">
            Back to cases
          </button>
        </div>
      </div>
    );
  }

  const isFinalized = caseData.status === 'FINALIZED';
  const canEdit = caseData.status === 'DRAFT' && caseData.preparedById === user?.id;
  const canReview = caseData.status === 'UNDER_REVIEW' && (user?.role === 'MANAGER' || user?.role === 'PARTNER' || user?.role === 'ADMIN');
  const canFinalize = caseData.status === 'UNDER_REVIEW' && caseData.reviewedById && (user?.role === 'PARTNER' || user?.role === 'ADMIN');

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to cases
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{caseData.caseNumber}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded ${
                  isFinalized ? 'bg-green-100 text-green-800' :
                  caseData.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {caseData.status}
                </span>
                {isFinalized && <Lock className="w-5 h-5 text-green-600" />}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {caseData.client?.name} • FY {caseData.fiscalYear} • {caseData.caseType}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ExportButtons caseId={id} type="case" />
              <ShareButton caseId={id!} />
              
              {canEdit && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={actionLoading || bundles.length === 0}
                  className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Submitting...' : 'Submit for Review'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-300 mb-6">
          <div className="flex gap-6">
            {['overview', 'files', 'review', 'audit'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2">
            {activeTab === 'overview' && (
              <div className="bg-white border border-gray-300 p-6">
                <h2 className="text-lg font-semibold mb-4">Case Information</h2>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-gray-600">Case Number</dt>
                    <dd className="text-sm text-gray-900 mt-1">{caseData.caseNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-600">Client</dt>
                    <dd className="text-sm text-gray-900 mt-1">{caseData.client?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-600">Fiscal Year</dt>
                    <dd className="text-sm text-gray-900 mt-1">{caseData.fiscalYear}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-600">Case Type</dt>
                    <dd className="text-sm text-gray-900 mt-1">{caseData.caseType}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-600">Prepared By</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {caseData.preparedBy ? `${caseData.preparedBy.firstName} ${caseData.preparedBy.lastName}` : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-600">Created</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {new Date(caseData.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  {caseData.reviewedBy && (
                    <div>
                      <dt className="text-xs font-medium text-gray-600">Reviewed By</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {caseData.reviewedBy.firstName} {caseData.reviewedBy.lastName}
                      </dd>
                    </div>
                  )}
                  {caseData.approvedBy && (
                    <div>
                      <dt className="text-xs font-medium text-gray-600">Approved By</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {caseData.approvedBy.firstName} {caseData.approvedBy.lastName}
                      </dd>
                    </div>
                  )}
                  {caseData.finalizedAt && (
                    <div>
                      <dt className="text-xs font-medium text-gray-600">Finalized</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {new Date(caseData.finalizedAt).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-4">
                {bundles.length === 0 ? (
                  <EmptyNoFiles />
                ) : (
                  bundles.map((bundle: any) => (
                    <div key={bundle.id} className="bg-white border border-gray-300 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold">{bundle.bundleName}</h3>
                        {bundle.isFinalized && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <Lock className="w-3 h-3" />
                            Finalized
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {bundle.files.map((file: any) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.fileSize / 1024).toFixed(2)} KB • SHA-256: {file.sha256Hash.substring(0, 16)}...
                                </p>
                              </div>
                            </div>
                            <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'review' && (
              <div className="bg-white border border-gray-300 p-6">
                <h2 className="text-lg font-semibold mb-4">Review & Approval</h2>
                
                {canReview ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review Comments
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Add your review comments..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(true)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReview(false)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ) : canFinalize ? (
                  <div>
                    <button
                      onClick={() => setShowFinalizeModal(true)}
                      className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800"
                    >
                      Finalize Case
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    {isFinalized ? 'This case is finalized and locked.' : 'You do not have permission to review this case.'}
                  </p>
                )}

                {/* Approval Chain */}
                {approvalChain.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-300">
                    <h3 className="text-sm font-semibold mb-3">Approval History</h3>
                    <div className="space-y-3">
                      {approvalChain.map((item: any) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.action}</p>
                            <p className="text-xs text-gray-600">
                              by {item.actionBy.firstName} {item.actionBy.lastName} • {new Date(item.timestamp).toLocaleString()}
                            </p>
                            {item.comments && (
                              <p className="text-xs text-gray-600 mt-1 italic">"{item.comments}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="bg-white border border-gray-300 p-6">
                <h2 className="text-lg font-semibold mb-4">Audit Trail</h2>
                <div className="space-y-3">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="flex gap-3 pb-3 border-b border-gray-200 last:border-0">
                      <div className="flex-shrink-0">
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{log.action}</p>
                        <p className="text-xs text-gray-600">
                          {log.user.firstName} {log.user.lastName} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white border border-gray-300 p-4">
              <h3 className="text-sm font-semibold mb-3">Status</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {caseData.status === 'DRAFT' && <Clock className="w-4 h-4 text-gray-600" />}
                  {caseData.status === 'UNDER_REVIEW' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                  {caseData.status === 'FINALIZED' && <Lock className="w-4 h-4 text-green-600" />}
                  <span className="text-sm font-medium">{caseData.status}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white border border-gray-300 p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Stats</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-xs text-gray-600">Bundles</dt>
                  <dd className="text-xs font-medium text-gray-900">{bundles.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-gray-600">Files</dt>
                  <dd className="text-xs font-medium text-gray-900">
                    {bundles.reduce((acc, b) => acc + b.files.length, 0)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-gray-600">Audit Logs</dt>
                  <dd className="text-xs font-medium text-gray-900">{auditLogs.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Finalize Modal */}
        {showFinalizeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Finalize Case</h3>
              <p className="text-sm text-gray-600 mb-4">
                This action is irreversible. The case will be locked and cannot be edited.
              </p>
              <textarea
                value={finalizeComment}
                onChange={(e) => setFinalizeComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 mb-4"
                placeholder="Final comments (optional)..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  {actionLoading ? 'Finalizing...' : 'Finalize'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

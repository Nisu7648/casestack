import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, FileText, CheckCircle, Clock, Upload, Download, AlertTriangle, X } from 'lucide-react';

// ============================================
// 4️⃣ CASE DETAIL SCREEN
// Tabs: Overview, Files, Review & Approval, Audit History
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
      
      // Load case
      const caseResponse = await fetch(`/api/cases/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const caseData = await caseResponse.json();
      setCaseData(caseData.case);

      // Load bundles
      const bundlesResponse = await fetch(`/api/bundles/case/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bundlesData = await bundlesResponse.json();
      setBundles(bundlesData.bundles);

      // Load approval chain
      const approvalResponse = await fetch(`/api/cases/${id}/approval-chain`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const approvalData = await approvalResponse.json();
      setApprovalChain(approvalData.approvalChain);

      // Load audit logs
      const auditResponse = await fetch(`/api/audit/case/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const auditData = await auditResponse.json();
      setAuditLogs(auditData.logs);
    } catch (error) {
      console.error('Load case error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!confirm('Submit this case for review? You cannot edit it after submission.')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/cases/${id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('Case submitted for review');
      loadCaseData();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit case');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (approved: boolean) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/cases/${id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approved,
          comments: reviewComment
        })
      });
      alert(approved ? 'Case approved' : 'Case rejected');
      setReviewComment('');
      loadCaseData();
    } catch (error) {
      console.error('Review error:', error);
      alert('Failed to review case');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalize = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/cases/${id}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          finalComments: finalizeComment
        })
      });
      alert('✅ CASE FINALIZED AND LOCKED. This action is irreversible.');
      setShowFinalizeModal(false);
      setFinalizeComment('');
      loadCaseData();
    } catch (error) {
      console.error('Finalize error:', error);
      alert('Failed to finalize case');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-gray-600">Loading case...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-gray-600">Case not found</div>
      </div>
    );
  }

  const isFinalized = caseData.status === 'FINALIZED';
  const isUnderReview = caseData.status === 'UNDER_REVIEW';
  const isDraft = caseData.status === 'DRAFT';
  const isOwner = user?.id === caseData.preparedById;
  const isPartner = user?.role === 'PARTNER' || user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER' || isPartner;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{caseData.caseName}</h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium ${
                isFinalized 
                  ? 'bg-gray-100 text-gray-800' 
                  : isUnderReview
                  ? 'bg-blue-50 text-blue-800'
                  : 'bg-yellow-50 text-yellow-800'
              }`}>
                {isFinalized && <Lock className="w-4 h-4" />}
                {caseData.status}
              </span>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
            >
              Back to Cases
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Case Number: <strong>{caseData.caseNumber}</strong></span>
            <span>•</span>
            <span>Client: <strong>{caseData.client.name}</strong></span>
            <span>•</span>
            <span>Fiscal Year: <strong>{caseData.fiscalYear}</strong></span>
            <span>•</span>
            <span>Type: <strong>{caseData.caseType}</strong></span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-300 mb-6">
          <div className="flex gap-6">
            {['overview', 'files', 'review', 'audit'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'overview' && 'OVERVIEW'}
                {tab === 'files' && 'FILES'}
                {tab === 'review' && 'REVIEW & APPROVAL'}
                {tab === 'audit' && 'AUDIT HISTORY'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Case Metadata */}
            <div className="bg-white border border-gray-300 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">CASE METADATA</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Period</p>
                  <p className="text-sm text-gray-900">
                    {new Date(caseData.periodStart).toLocaleDateString()} - {new Date(caseData.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Prepared By</p>
                  <p className="text-sm text-gray-900">
                    {caseData.preparedBy.firstName} {caseData.preparedBy.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Reviewed By</p>
                  <p className="text-sm text-gray-900">
                    {caseData.reviewedBy 
                      ? `${caseData.reviewedBy.firstName} ${caseData.reviewedBy.lastName}`
                      : 'Not yet reviewed'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Approved By (Partner)</p>
                  <p className="text-sm text-gray-900">
                    {caseData.approvedBy 
                      ? `${caseData.approvedBy.firstName} ${caseData.approvedBy.lastName}`
                      : 'Not yet approved'}
                  </p>
                </div>
                {caseData.finalizedAt && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Finalized At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(caseData.finalizedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {caseData.description && (
              <div className="bg-white border border-gray-300 p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-2">DESCRIPTION</h2>
                <p className="text-sm text-gray-700">{caseData.description}</p>
              </div>
            )}

            {/* Finalization Rules */}
            <div className="bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">FINALIZATION RULES</p>
                  <ul className="text-xs text-yellow-800 space-y-1">
                    <li>• Once finalized, this case becomes READ-ONLY</li>
                    <li>• All files will be LOCKED permanently</li>
                    <li>• No edits, deletions, or modifications allowed</li>
                    <li>• Only Partners can finalize cases</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isDraft && isOwner && (
              <button
                onClick={handleSubmitForReview}
                disabled={actionLoading || bundles.length === 0}
                className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 text-sm font-medium"
              >
                Submit for Review
              </button>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-4">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="bg-white border border-gray-300">
                <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{bundle.bundleName}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Version {bundle.version} • {bundle.files.length} files
                      {bundle.isFinalized && ' • FINALIZED'}
                    </p>
                  </div>
                  <button className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Bundle
                  </button>
                </div>
                <div className="p-4">
                  {bundle.files.length === 0 ? (
                    <p className="text-sm text-gray-600">No files uploaded</p>
                  ) : (
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">FILE NAME</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">TYPE</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">SIZE</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">UPLOADED</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bundle.files.map((file: any) => (
                          <tr key={file.id} className="border-b border-gray-100">
                            <td className="px-2 py-2 text-sm text-gray-900">{file.fileName}</td>
                            <td className="px-2 py-2 text-sm text-gray-600">{file.fileType}</td>
                            <td className="px-2 py-2 text-sm text-gray-600">
                              {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                            </td>
                            <td className="px-2 py-2 text-sm text-gray-600">
                              {new Date(file.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-2 py-2">
                              {file.isLocked && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                  <Lock className="w-3 h-3" />
                                  Locked
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}

            {!isFinalized && (
              <div className="bg-gray-50 border border-gray-300 p-4">
                <p className="text-xs text-gray-600">
                  Upload files only when case is ready for review or finalization. No editing inside system.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-6">
            {isUnderReview && isManager && !caseData.reviewedById && (
              <div className="bg-white border border-gray-300 p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-4">REVIEW CASE</h2>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Review Comments</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
                    rows={4}
                    placeholder="Optional comments..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {isUnderReview && isPartner && caseData.reviewedById && (
              <div className="bg-white border border-gray-300 p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-4">FINALIZE CASE (PARTNER ONLY)</h2>
                <div className="bg-red-50 border border-red-200 p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-1">⚠️ IRREVERSIBLE ACTION</p>
                      <ul className="text-xs text-red-800 space-y-1">
                        <li>• This case will be PERMANENTLY LOCKED</li>
                        <li>• All files will become READ-ONLY</li>
                        <li>• No modifications will be possible</li>
                        <li>• This action CANNOT be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowFinalizeModal(true)}
                  className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 text-sm font-medium"
                >
                  Finalize Case
                </button>
              </div>
            )}

            {/* Approval Chain */}
            <div className="bg-white border border-gray-300 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">APPROVAL CHAIN</h2>
              {approvalChain.length === 0 ? (
                <p className="text-sm text-gray-600">No approval actions yet</p>
              ) : (
                <div className="space-y-3">
                  {approvalChain.map((approval) => (
                    <div key={approval.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                      <div className="flex-shrink-0 mt-1">
                        {approval.action === 'FINALIZED' && <Lock className="w-4 h-4 text-gray-600" />}
                        {approval.action === 'APPROVED' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {approval.action === 'REVIEWED' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                        {approval.action === 'SUBMITTED_FOR_REVIEW' && <Clock className="w-4 h-4 text-yellow-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{approval.action}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          By {approval.actionBy.firstName} {approval.actionBy.lastName} ({approval.actionBy.role})
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(approval.createdAt).toLocaleString()}
                        </p>
                        {approval.comments && (
                          <p className="text-sm text-gray-700 mt-2 italic">"{approval.comments}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white border border-gray-300">
            <div className="px-4 py-3 border-b border-gray-300">
              <h2 className="text-sm font-bold text-gray-900">AUDIT HISTORY</h2>
              <p className="text-xs text-gray-600 mt-1">Read-only. Cannot be hidden.</p>
            </div>
            <div className="p-4">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-gray-600">No audit logs</p>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 pb-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-900">{log.action}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-600">
                            {log.user.firstName} {log.user.lastName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finalize Modal */}
        {showFinalizeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md border border-gray-300">
              <div className="px-6 py-4 border-b border-gray-300 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Finalize Case</h3>
                <button onClick={() => setShowFinalizeModal(false)}>
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 p-4 mb-4">
                  <p className="text-sm font-medium text-red-900 mb-2">⚠️ LEGAL WARNING</p>
                  <p className="text-xs text-red-800">
                    By finalizing this case, you confirm that all information is accurate and complete. 
                    This action is PERMANENT and IRREVERSIBLE. The case will be LOCKED forever.
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Final Comments (Optional)
                  </label>
                  <textarea
                    value={finalizeComment}
                    onChange={(e) => setFinalizeComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
                    rows={3}
                    placeholder="Any final notes..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFinalizeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalize}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {actionLoading ? 'Finalizing...' : 'FINALIZE CASE'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

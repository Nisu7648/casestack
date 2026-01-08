import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link as LinkIcon, Plus, Trash2, ExternalLink } from 'lucide-react';

// ============================================
// EVIDENCE REFERENCE - Screen 5
// Document tracking (NO uploads, only references)
// ============================================

interface Evidence {
  id: string;
  fileName: string;
  sourceSystem: string;
  sourceUrl: string | null;
  linkedSection: string | null;
  addedBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const SECTION_TYPES = ['SCOPE', 'METHODOLOGY', 'FINDINGS', 'OBSERVATIONS', 'CONCLUSIONS', 'RECOMMENDATIONS'];

export default function EvidenceReference() {
  const { engagementId } = useParams();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    fileName: '',
    sourceSystem: '',
    sourceUrl: '',
    linkedSection: ''
  });

  useEffect(() => {
    loadEvidence();
  }, [engagementId]);

  const loadEvidence = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/evidence/engagement/${engagementId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setEvidence(data.evidence || []);
    } catch (error) {
      console.error('Failed to load evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          engagementId,
          linkedSection: formData.linkedSection || null
        })
      });

      if (response.ok) {
        await loadEvidence();
        setShowAddModal(false);
        setFormData({ fileName: '', sourceSystem: '', sourceUrl: '', linkedSection: '' });
      }
    } catch (error) {
      console.error('Failed to add evidence:', error);
      alert('Failed to add evidence');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this evidence reference?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/evidence/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await loadEvidence();
    } catch (error) {
      console.error('Failed to delete evidence:', error);
      alert('Failed to delete evidence');
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evidence References</h1>
            <p className="text-gray-600 mt-1">Track supporting documents (no uploads, references only)</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Reference
          </button>
        </div>

        {evidence.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <LinkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No evidence references yet</h3>
            <p className="text-gray-500 mb-4">Add references to external documents</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add First Reference
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source System</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linked Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Added</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evidence.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <LinkIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{item.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.sourceSystem}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.linkedSection ? (
                        <span className="text-sm text-gray-900">{item.linkedSection}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Not linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {item.addedBy.firstName} {item.addedBy.lastName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Evidence Reference</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Financial_Report_2024.xlsx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source System *</label>
                  <input
                    type="text"
                    required
                    value={formData.sourceSystem}
                    onChange={(e) => setFormData({ ...formData, sourceSystem: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., SharePoint, OneDrive, Email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Linked Section (Optional)</label>
                  <select
                    value={formData.linkedSection}
                    onChange={(e) => setFormData({ ...formData, linkedSection: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not linked</option>
                    {SECTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Reference
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

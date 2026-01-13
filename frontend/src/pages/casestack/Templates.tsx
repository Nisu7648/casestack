import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Edit, Trash2, Download, Sparkles } from 'lucide-react';
import { LoadingTable } from '../../components/ui/LoadingState';
import { showSuccess, showError } from '../../components/ui/Toast';

// ============================================
// TEMPLATES PAGE
// List, create, edit document templates
// ============================================

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [category]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = category ? `?category=${category}` : '';
      const response = await fetch(`/api/templates${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load templates');

      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Load templates error:', error);
      showError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Create default templates? This will add 3 standard templates.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/templates/seed-defaults', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to seed templates');

      const data = await response.json();
      showSuccess(data.message);
      loadTemplates();
    } catch (error) {
      console.error('Seed templates error:', error);
      showError('Failed to create default templates');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete template');

      showSuccess('Template deleted successfully');
      loadTemplates();
    } catch (error: any) {
      console.error('Delete template error:', error);
      showError(error.message || 'Failed to delete template');
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'TAX_AUDIT':
        return 'bg-blue-100 text-blue-800';
      case 'FINANCIAL_AUDIT':
        return 'bg-green-100 text-green-800';
      case 'COMPLIANCE':
        return 'bg-purple-100 text-purple-800';
      case 'ADVISORY':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
            <p className="text-sm text-gray-600 mt-1">
              {loading ? 'Loading...' : `${templates.length} template${templates.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSeedDefaults}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Add Default Templates
            </button>
            <button
              onClick={() => navigate('/templates/new')}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">All Categories</option>
            <option value="TAX_AUDIT">Tax Audit</option>
            <option value="FINANCIAL_AUDIT">Financial Audit</option>
            <option value="COMPLIANCE">Compliance</option>
            <option value="ADVISORY">Advisory</option>
          </select>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <LoadingTable rows={6} />
        ) : templates.length === 0 ? (
          <div className="bg-white border border-gray-300 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create your first template or add default templates to get started
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleSeedDefaults}
                className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50"
              >
                Add Default Templates
              </button>
              <button
                onClick={() => navigate('/templates/new')}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
              >
                Create Template
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {templates.map((template: any) => (
              <div
                key={template.id}
                className="bg-white border border-gray-300 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(template.category)}`}>
                      {template.category.replace('_', ' ')}
                    </span>
                  </div>
                  {template.isDefault && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                      Default
                    </span>
                  )}
                </div>

                {template.description && (
                  <p className="text-xs text-gray-600 mb-4">
                    {template.description}
                  </p>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  <p>Created by {template.createdBy.firstName} {template.createdBy.lastName}</p>
                  <p>{new Date(template.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/templates/${template.id}/generate`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-black text-white text-xs hover:bg-gray-800 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Generate
                  </button>
                  <button
                    onClick={() => navigate(`/templates/${template.id}/edit`)}
                    className="px-3 py-2 border border-gray-300 text-xs hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
                      className="px-3 py-2 border border-red-300 text-red-600 text-xs hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

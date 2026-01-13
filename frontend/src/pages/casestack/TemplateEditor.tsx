import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { showSuccess, showError } from '../../components/ui/Toast';

// ============================================
// TEMPLATE EDITOR
// Create/edit templates with variables
// ============================================

export default function TemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'TAX_AUDIT',
    description: '',
    content: '',
    variables: [] as string[]
  });
  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    if (isEdit) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/templates/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load template');

      const data = await response.json();
      setFormData({
        name: data.template.name,
        category: data.template.category,
        description: data.template.description || '',
        content: data.template.content,
        variables: JSON.parse(data.template.variables || '[]')
      });
    } catch (error) {
      console.error('Load template error:', error);
      showError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content) {
      showError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEdit ? `/api/templates/${id}` : '/api/templates';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save template');

      showSuccess(isEdit ? 'Template updated successfully' : 'Template created successfully');
      navigate('/templates');
    } catch (error) {
      console.error('Save template error:', error);
      showError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariable = () => {
    if (!newVariable.trim()) return;
    if (formData.variables.includes(newVariable)) {
      showError('Variable already exists');
      return;
    }

    setFormData({
      ...formData,
      variables: [...formData.variables, newVariable]
    });
    setNewVariable('');
  };

  const handleRemoveVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable)
    });
  };

  const handleInsertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setFormData({
      ...formData,
      content: before + `{{${variable}}}` + after
    });

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
    }, 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to templates
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Template' : 'New Template'}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-300 p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., Tax Audit Report"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="TAX_AUDIT">Tax Audit</option>
              <option value="FINANCIAL_AUDIT">Financial Audit</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="ADVISORY">Advisory</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Brief description of this template"
            />
          </div>

          {/* Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddVariable()}
                className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., clientName"
              />
              <button
                onClick={handleAddVariable}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.variables.map((variable) => (
                <div
                  key={variable}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                >
                  <button
                    onClick={() => handleInsertVariable(variable)}
                    className="hover:underline"
                  >
                    {variable}
                  </button>
                  <button
                    onClick={() => handleRemoveVariable(variable)}
                    className="hover:bg-blue-200 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click a variable to insert it into the content. Use format: {`{{variableName}}`}
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Content <span className="text-red-600">*</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter your template content here. Use {{variableName}} for dynamic values."
            />
            <p className="text-xs text-gray-500 mt-2">
              Use {`{{variableName}}`} to insert variables that will be replaced when generating documents.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-300">
            <button
              onClick={() => navigate('/templates')}
              className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

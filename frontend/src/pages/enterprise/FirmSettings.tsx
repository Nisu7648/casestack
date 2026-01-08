import React, { useState, useEffect } from 'react';
import { Save, Building2, Settings as SettingsIcon } from 'lucide-react';

// ============================================
// FIRM SETTINGS - Screen 11 (Admin only)
// Configure firm-wide policies
// ============================================

interface FirmData {
  id: string;
  name: string;
  industry: string | null;
  retentionYears: number;
  lockAfterDays: number;
  settings: {
    autoLockReports: boolean;
    requirePartnerApproval: boolean;
    enableAuditExport: boolean;
  } | null;
}

export default function FirmSettings() {
  const [firm, setFirm] = useState<FirmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setFirm(data.firm);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFirm = async () => {
    if (!firm) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/settings/firm', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: firm.name,
          industry: firm.industry,
          retentionYears: firm.retentionYears,
          lockAfterDays: firm.lockAfterDays
        })
      });
      alert('Firm settings saved successfully');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!firm?.settings) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/settings/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(firm.settings)
      });
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!firm) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Firm Settings</h1>
          <p className="text-gray-600 mt-1">Configure firm-wide policies and preferences</p>
        </div>

        {/* Firm Information */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Firm Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Firm Name</label>
              <input
                type="text"
                value={firm.name}
                onChange={(e) => setFirm({ ...firm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
              <input
                type="text"
                value={firm.industry || ''}
                onChange={(e) => setFirm({ ...firm, industry: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Consulting, Audit, Tax"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Retention (Years)
                </label>
                <input
                  type="number"
                  value={firm.retentionYears}
                  onChange={(e) => setFirm({ ...firm, retentionYears: parseInt(e.target.value) })}
                  min={1}
                  max={20}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">How long to keep data</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Lock After (Days)
                </label>
                <input
                  type="number"
                  value={firm.lockAfterDays}
                  onChange={(e) => setFirm({ ...firm, lockAfterDays: parseInt(e.target.value) })}
                  min={0}
                  max={365}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Auto-lock reports after X days</p>
              </div>
            </div>

            <button
              onClick={handleSaveFirm}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Firm Info'}
            </button>
          </div>
        </div>

        {/* Workflow Settings */}
        {firm.settings && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Workflow Settings</h2>
            </div>
            <div className="p-6 space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={firm.settings.autoLockReports}
                  onChange={(e) => setFirm({
                    ...firm,
                    settings: { ...firm.settings!, autoLockReports: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Auto-Lock Reports</span>
                  <p className="text-sm text-gray-500">Automatically lock reports after specified days</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={firm.settings.requirePartnerApproval}
                  onChange={(e) => setFirm({
                    ...firm,
                    settings: { ...firm.settings!, requirePartnerApproval: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Require Partner Approval</span>
                  <p className="text-sm text-gray-500">All reports must be approved by a partner</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={firm.settings.enableAuditExport}
                  onChange={(e) => setFirm({
                    ...firm,
                    settings: { ...firm.settings!, enableAuditExport: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Enable Audit Export</span>
                  <p className="text-sm text-gray-500">Allow exporting audit logs to CSV</p>
                </span>
              </label>

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Workflow Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

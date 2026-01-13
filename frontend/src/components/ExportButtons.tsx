import React, { useState } from 'react';
import { Download, FileText, Table, Archive, Mail } from 'lucide-react';
import { showSuccess, showError } from './ui/Toast';

// ============================================
// EXPORT BUTTONS
// PDF, Excel, CSV, ZIP exports
// ============================================

interface ExportButtonsProps {
  caseId?: string;
  type: 'case' | 'cases' | 'audit-logs';
  filters?: any;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ caseId, type, filters }) => {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportFile = async (format: string) => {
    setExporting(format);
    try {
      const token = localStorage.getItem('token');
      let url = '';

      if (type === 'case' && caseId) {
        url = `/api/export/case/${caseId}/${format}`;
      } else if (type === 'cases') {
        const params = new URLSearchParams(filters || {});
        url = `/api/export/cases/${format}?${params}`;
      } else if (type === 'audit-logs') {
        const params = new URLSearchParams(filters || {});
        url = `/api/export/audit-logs/${format}?${params}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      showSuccess(`Exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {type === 'case' && (
        <>
          <button
            onClick={() => exportFile('pdf')}
            disabled={exporting === 'pdf'}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
          </button>

          <button
            onClick={() => exportFile('zip')}
            disabled={exporting === 'zip'}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            {exporting === 'zip' ? 'Exporting...' : 'ZIP'}
          </button>
        </>
      )}

      {type === 'cases' && (
        <button
          onClick={() => exportFile('excel')}
          disabled={exporting === 'excel'}
          className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Table className="w-4 h-4" />
          {exporting === 'excel' ? 'Exporting...' : 'Excel'}
        </button>
      )}

      {type === 'audit-logs' && (
        <button
          onClick={() => exportFile('csv')}
          disabled={exporting === 'csv'}
          className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting === 'csv' ? 'Exporting...' : 'CSV'}
        </button>
      )}
    </div>
  );
};

// Share case via email
export const ShareButton: React.FC<{ caseId: string }> = ({ caseId }) => {
  const [sharing, setSharing] = useState(false);
  const [email, setEmail] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const shareCase = async () => {
    if (!email) {
      showError('Please enter an email address');
      return;
    }

    setSharing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cases/${caseId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) throw new Error('Share failed');

      showSuccess(`Case shared with ${email}`);
      setShowDialog(false);
      setEmail('');
    } catch (error) {
      console.error('Share error:', error);
      showError('Failed to share case');
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
      >
        <Mail className="w-4 h-4" />
        Share
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Share Case</h3>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={shareCase}
                disabled={sharing}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportButtons;

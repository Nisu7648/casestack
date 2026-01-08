import React, { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';

// ============================================
// DOSSIER BUILDER - Screen 8
// PDF generation for client delivery
// ============================================

export default function DossierBuilder() {
  const [title, setTitle] = useState('');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!title || selectedReports.length === 0) {
      alert('Please provide a title and select at least one report');
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dossiers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          reportIds: selectedReports
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Dossier generated successfully! Expires in 24 hours.');
        
        // Download PDF
        if (data.dossier.pdfUrl) {
          const link = document.createElement('a');
          link.href = data.dossier.pdfUrl;
          link.download = `${title}.pdf`;
          link.click();
        }
      } else {
        alert('Failed to generate dossier');
      }
    } catch (error) {
      console.error('Failed to generate dossier:', error);
      alert('Failed to generate dossier');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dossier Builder</h1>
          <p className="text-gray-600 mt-1">Generate professional PDFs for client delivery</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dossier Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q4 2024 Audit Report"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Reports *</label>
            <p className="text-sm text-gray-500 mb-3">Choose one or more reports to include</p>
            <div className="border border-gray-300 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm text-gray-500">Load your reports here...</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">PDF Will Include:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Professional cover page with firm branding</li>
              <li>• Table of contents</li>
              <li>• All selected reports with sections</li>
              <li>• Evidence appendix</li>
              <li>• Audit trail summary</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={generating || !title || selectedReports.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {generating ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center">
            Generated dossiers expire after 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Lock, Unlock, Send, CheckCircle, AlertCircle } from 'lucide-react';

// ============================================
// REPORT WORKSPACE - MOST IMPORTANT SCREEN
// 3-Panel Layout: Section Index | Content Editor | Review Comments
// ============================================

interface ReportSection {
  id: string;
  type: 'SCOPE' | 'METHODOLOGY' | 'FINDINGS' | 'OBSERVATIONS' | 'CONCLUSIONS' | 'RECOMMENDATIONS';
  content: string;
  isLocked: boolean;
  updatedAt: string;
}

interface Comment {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
  content: string;
  sectionId?: string;
  isResolved: boolean;
  createdAt: string;
}

const SECTION_TYPES = [
  { type: 'SCOPE', label: 'Scope', order: 1 },
  { type: 'METHODOLOGY', label: 'Methodology', order: 2 },
  { type: 'FINDINGS', label: 'Findings', order: 3 },
  { type: 'OBSERVATIONS', label: 'Observations', order: 4 },
  { type: 'CONCLUSIONS', label: 'Conclusions', order: 5 },
  { type: 'RECOMMENDATIONS', label: 'Recommendations', order: 6 },
];

export default function ReportWorkspace() {
  const { engagementId } = useParams();
  const [activeSection, setActiveSection] = useState<string>('SCOPE');
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentFilter, setCommentFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [reportId, setReportId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load report data
  useEffect(() => {
    loadReportData();
  }, [engagementId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSection = getCurrentSection();
      if (currentSection && content !== currentSection.content && !currentSection.isLocked) {
        handleSave();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [content, sections, activeSection]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get report by engagement ID
      const reportResponse = await fetch(`/api/reports/engagement/${engagementId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reportData = await reportResponse.json();
      
      if (reportData.report) {
        setReportId(reportData.report.id);
        setSections(reportData.report.sections || []);
        setComments(reportData.report.comments || []);
        
        // Set initial content
        const scopeSection = reportData.report.sections?.find((s: ReportSection) => s.type === 'SCOPE');
        if (scopeSection) {
          setContent(scopeSection.content);
        }
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      alert('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSection = () => {
    return sections.find(s => s.type === activeSection);
  };

  const handleSectionChange = (sectionType: string) => {
    // Save current section before switching
    const currentSection = getCurrentSection();
    if (currentSection && content !== currentSection.content && !currentSection.isLocked) {
      handleSave();
    }
    
    setActiveSection(sectionType);
    const section = sections.find(s => s.type === sectionType);
    setContent(section?.content || '');
  };

  const handleSave = async () => {
    const section = getCurrentSection();
    if (!section || section.isLocked) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}/sections/${section.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        
        // Update local state
        setSections(sections.map(s => 
          s.type === activeSection ? { ...s, content } : s
        ));
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save section');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockSection = async () => {
    const section = getCurrentSection();
    if (!section) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}/sections/${section.id}/lock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSections(sections.map(s => 
          s.id === section.id ? { ...s, isLocked: data.section.isLocked } : s
        ));
      }
    } catch (error) {
      console.error('Failed to lock section:', error);
      alert('Failed to lock/unlock section');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment,
          sectionId: getCurrentSection()?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}/comments/${commentId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, isResolved: data.comment.isResolved } : c
        ));
      }
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const filteredComments = comments.filter(c => {
    if (commentFilter === 'unresolved') return !c.isResolved;
    if (commentFilter === 'resolved') return c.isResolved;
    return true;
  }).filter(c => !c.sectionId || c.sectionId === getCurrentSection()?.id);

  const currentSection = getCurrentSection();
  const isLocked = currentSection?.isLocked || false;
  const unresolvedCount = comments.filter(c => !c.isResolved).length;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Report Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">
              {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unresolvedCount > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {unresolvedCount} unresolved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || isLocked}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL - Section Index */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Sections
            </h2>
            <div className="space-y-1">
              {SECTION_TYPES.map(({ type, label }) => {
                const section = sections.find(s => s.type === type);
                const isActive = activeSection === type;
                const hasContent = section && section.content.length > 0;
                const sectionLocked = section?.isLocked || false;

                return (
                  <button
                    key={type}
                    onClick={() => handleSectionChange(type)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{label}</span>
                      <div className="flex items-center gap-2">
                        {hasContent && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {sectionLocked && <Lock className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER PANEL - Content Editor */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {SECTION_TYPES.find(s => s.type === activeSection)?.label}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {content.length} characters
              </span>
              {currentSection && (
                <button
                  onClick={handleLockSection}
                  className={`px-3 py-1 rounded-lg flex items-center gap-2 text-sm ${
                    isLocked
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {isLocked ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Locked
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      Unlocked
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {isLocked ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">This section is locked</p>
                <p className="text-sm text-gray-500 mt-1">
                  Only managers and partners can unlock sections
                </p>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full resize-none border-0 focus:ring-0 text-gray-900 text-base leading-relaxed p-0"
                placeholder="Start writing..."
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Review Comments */}
        <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
          <div className="border-b border-gray-200 px-4 py-3 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Comments</h2>
            <div className="flex gap-2">
              {(['all', 'unresolved', 'resolved'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCommentFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    commentFilter === filter
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredComments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No comments yet</p>
              </div>
            ) : (
              filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`bg-white rounded-lg p-4 border ${
                    comment.isResolved ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {comment.user.firstName} {comment.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{comment.user.role}</p>
                    </div>
                    <button
                      onClick={() => handleResolveComment(comment.id)}
                      className={`text-xs px-2 py-1 rounded ${
                        comment.isResolved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {comment.isResolved ? '✓ Resolved' : 'Resolve'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-200 p-4 bg-white">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

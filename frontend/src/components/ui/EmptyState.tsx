import React from 'react';
import { FileText, Search, Archive, Users, AlertCircle } from 'lucide-react';

// ============================================
// EMPTY STATES - Better UX
// Show helpful messages when no data
// ============================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    {icon && (
      <div className="mb-4 text-gray-400">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 text-center max-w-md mb-6">
      {description}
    </p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

// Predefined empty states
export const EmptyNoCases: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => (
  <EmptyState
    icon={<FileText className="w-16 h-16" />}
    title="No cases yet"
    description="Get started by creating your first case. You can add case details, upload documents, and track the workflow."
    action={onCreate ? {
      label: "Create First Case",
      onClick: onCreate
    } : undefined}
  />
);

export const EmptyNoFiles: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => (
  <EmptyState
    icon={<FileText className="w-12 h-12" />}
    title="No files uploaded"
    description="Upload documents to this case. All files are verified with SHA-256 and tracked in the audit log."
    action={onUpload ? {
      label: "Upload Files",
      onClick: onUpload
    } : undefined}
  />
);

export const EmptySearchResults: React.FC = () => (
  <EmptyState
    icon={<Search className="w-16 h-16" />}
    title="No results found"
    description="Try adjusting your search filters or search terms. You can search by case number, client name, or fiscal year."
  />
);

export const EmptyArchive: React.FC = () => (
  <EmptyState
    icon={<Archive className="w-16 h-16" />}
    title="No archived cases"
    description="Finalized cases will appear here after 7 years. They remain searchable but are separated from active cases."
  />
);

export const EmptyUsers: React.FC<{ onInvite?: () => void }> = ({ onInvite }) => (
  <EmptyState
    icon={<Users className="w-16 h-16" />}
    title="No team members"
    description="Invite team members to collaborate on cases. You can assign different roles and permissions."
    action={onInvite ? {
      label: "Invite Team Member",
      onClick: onInvite
    } : undefined}
  />
);

export const EmptyAuditLogs: React.FC = () => (
  <EmptyState
    icon={<AlertCircle className="w-16 h-16" />}
    title="No audit logs"
    description="All actions will be logged here. Every case creation, file upload, and status change is tracked."
  />
);

// Error state
export const ErrorState: React.FC<{ 
  title?: string;
  description?: string;
  onRetry?: () => void;
}> = ({ 
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry
}) => (
  <EmptyState
    icon={<AlertCircle className="w-16 h-16 text-red-500" />}
    title={title}
    description={description}
    action={onRetry ? {
      label: "Try Again",
      onClick: onRetry
    } : undefined}
  />
);

export default EmptyState;

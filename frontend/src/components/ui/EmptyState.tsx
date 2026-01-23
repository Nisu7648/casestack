import React from 'react'
import { 
  FileText, 
  Search, 
  AlertCircle, 
  Inbox, 
  Users, 
  FolderOpen,
  Filter,
  Database,
  CheckCircle,
  Archive
} from 'lucide-react'

export interface EmptyStateProps {
  variant?: 'no-data' | 'no-results' | 'error' | 'success' | 'custom'
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * Enhanced EmptyState component for various empty scenarios
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-data',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  // Default icons for each variant
  const defaultIcons = {
    'no-data': <Inbox className="h-16 w-16" />,
    'no-results': <Search className="h-16 w-16" />,
    'error': <AlertCircle className="h-16 w-16" />,
    'success': <CheckCircle className="h-16 w-16" />,
    'custom': <FileText className="h-16 w-16" />,
  }

  // Colors for each variant
  const variantColors = {
    'no-data': 'text-neutral-400',
    'no-results': 'text-primary-400',
    'error': 'text-error-400',
    'success': 'text-success-400',
    'custom': 'text-neutral-400',
  }

  const displayIcon = icon || defaultIcons[variant]
  const iconColor = variantColors[variant]

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* Icon */}
      <div className={`mb-4 ${iconColor} animate-in fade-in zoom-in-95 duration-300`}>
        {displayIcon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-neutral-900 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-neutral-600 max-w-md mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300">
          {action && (
            <button
              onClick={action.onClick}
              className={`inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                action.variant === 'secondary'
                  ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500'
                  : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:scale-95'
              }`}
            >
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center px-6 py-2.5 border-2 border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Specific empty state components for common scenarios
 */

export const EmptyNoCases: React.FC<{
  onCreate?: () => void
}> = ({ onCreate }) => (
  <EmptyState
    variant="no-data"
    icon={<FolderOpen className="h-16 w-16" />}
    title="No cases yet"
    description="Get started by creating your first case. Track clients, documents, tasks, and more all in one place."
    action={
      onCreate
        ? {
            label: 'Create First Case',
            onClick: onCreate,
          }
        : undefined
    }
  />
)

export const EmptyNoClients: React.FC<{
  onAddClient?: () => void
}> = ({ onAddClient }) => (
  <EmptyState
    variant="no-data"
    icon={<Users className="h-16 w-16" />}
    title="No clients yet"
    description="Add your first client to start managing cases and building your client base."
    action={
      onAddClient
        ? {
            label: 'Add First Client',
            onClick: onAddClient,
          }
        : undefined
    }
  />
)

export const EmptyNoFiles: React.FC<{
  onUpload?: () => void
}> = ({ onUpload }) => (
  <EmptyState
    variant="no-data"
    icon={<FileText className="h-16 w-16" />}
    title="No files uploaded"
    description="Upload documents to keep all case-related files organized and accessible."
    action={
      onUpload
        ? {
            label: 'Upload Document',
            onClick: onUpload,
          }
        : undefined
    }
  />
)

export const EmptySearchResults: React.FC<{
  searchQuery?: string
  onClearSearch?: () => void
}> = ({ searchQuery, onClearSearch }) => (
  <EmptyState
    variant="no-results"
    title="No results found"
    description={
      searchQuery
        ? `We couldn't find anything matching "${searchQuery}". Try adjusting your search terms.`
        : "We couldn't find any results. Try adjusting your filters."
    }
    action={
      onClearSearch
        ? {
            label: 'Clear Search',
            onClick: onClearSearch,
            variant: 'secondary',
          }
        : undefined
    }
  />
)

export const EmptyNoFilterResults: React.FC<{
  onClearFilters?: () => void
}> = ({ onClearFilters }) => (
  <EmptyState
    variant="no-results"
    icon={<Filter className="h-16 w-16" />}
    title="No matches found"
    description="No items match your current filters. Try adjusting or clearing your filters."
    action={
      onClearFilters
        ? {
            label: 'Clear Filters',
            onClick: onClearFilters,
            variant: 'secondary',
          }
        : undefined
    }
  />
)

export const ErrorState: React.FC<{
  onRetry?: () => void
  title?: string
  description?: string
}> = ({ onRetry, title, description }) => (
  <EmptyState
    variant="error"
    title={title || "Something went wrong"}
    description={description || "We couldn't load this data. Please try again."}
    action={
      onRetry
        ? {
            label: 'Try Again',
            onClick: onRetry,
          }
        : undefined
    }
  />
)

export const EmptyArchive: React.FC = () => (
  <EmptyState
    variant="no-data"
    icon={<Archive className="h-16 w-16" />}
    title="No archived cases"
    description="Finalized cases will appear here after 7 years. They remain searchable but are separated from active cases."
  />
)

export const EmptyUsers: React.FC<{ onInvite?: () => void }> = ({ onInvite }) => (
  <EmptyState
    variant="no-data"
    icon={<Users className="h-16 w-16" />}
    title="No team members"
    description="Invite team members to collaborate on cases. You can assign different roles and permissions."
    action={
      onInvite
        ? {
            label: 'Invite Team Member',
            onClick: onInvite,
          }
        : undefined
    }
  />
)

export const EmptyAuditLogs: React.FC = () => (
  <EmptyState
    variant="no-data"
    icon={<AlertCircle className="h-16 w-16" />}
    title="No audit logs"
    description="All actions will be logged here. Every case creation, file upload, and status change is tracked."
  />
)

export const EmptyNoData: React.FC<{
  title?: string
  description?: string
  icon?: React.ReactNode
}> = ({ 
  title = "No data available", 
  description = "There's nothing to show here yet.",
  icon 
}) => (
  <EmptyState
    variant="no-data"
    icon={icon || <Database className="h-16 w-16" />}
    title={title}
    description={description}
  />
)

export const EmptySuccess: React.FC<{
  title: string
  description?: string
  onAction?: () => void
  actionLabel?: string
}> = ({ title, description, onAction, actionLabel }) => (
  <EmptyState
    variant="success"
    title={title}
    description={description}
    action={
      onAction && actionLabel
        ? {
            label: actionLabel,
            onClick: onAction,
          }
        : undefined
    }
  />
)

export default EmptyState

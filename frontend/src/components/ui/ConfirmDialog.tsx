import React from 'react'
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  isLoading?: boolean
}

/**
 * ConfirmDialog - Modal dialog for confirming actions
 * Especially useful for destructive actions like delete
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null

  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-error-100',
      iconColor: 'text-error-600',
      buttonBg: 'bg-error-600 hover:bg-error-700 focus:ring-error-500',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      buttonBg: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500',
    },
    info: {
      icon: Info,
      iconBg: 'bg-info-100',
      iconColor: 'text-info-600',
      buttonBg: 'bg-info-600 hover:bg-info-700 focus:ring-info-500',
    },
    success: {
      icon: CheckCircle,
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      buttonBg: 'bg-success-600 hover:bg-success-700 focus:ring-success-500',
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm()
    if (!isLoading) {
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className={`${config.iconBg} rounded-full p-3`}>
            <Icon className={`h-8 w-8 ${config.iconColor}`} />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 text-center">
          <h3
            id="dialog-title"
            className="text-xl font-semibold text-neutral-900 mb-2"
          >
            {title}
          </h3>
          <p className="text-neutral-600">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-8 pb-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-neutral-100 text-neutral-900 rounded-lg font-medium hover:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonBg}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for managing confirm dialog state
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Partial<ConfirmDialogProps>>({})

  const open = (dialogConfig: Partial<ConfirmDialogProps>) => {
    setConfig(dialogConfig)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setTimeout(() => setConfig({}), 200) // Clear config after animation
  }

  return {
    isOpen,
    open,
    close,
    config,
  }
}

export default ConfirmDialog

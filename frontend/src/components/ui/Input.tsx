import React, { forwardRef } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isPassword?: boolean
  containerClassName?: string
}

/**
 * Polished Input component with validation states and icons
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      isPassword = false,
      containerClassName = '',
      className = '',
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    const baseClasses = 'block w-full rounded-lg border bg-white px-4 py-2.5 text-neutral-900 placeholder-neutral-400 transition-all duration-200 focus:outline-none disabled:bg-neutral-50 disabled:cursor-not-allowed'
    
    const stateClasses = error
      ? 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
      : success
      ? 'border-success-500 focus:border-success-500 focus:ring-2 focus:ring-success-500/20'
      : 'border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'

    const paddingClasses = leftIcon
      ? 'pl-11'
      : rightIcon || isPassword || error || success
      ? 'pr-11'
      : ''

    return (
      <div className={`w-full ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={`${baseClasses} ${stateClasses} ${paddingClasses} ${className}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Right Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Success Icon */}
            {success && !error && (
              <CheckCircle className="h-5 w-5 text-success-500" />
            )}

            {/* Error Icon */}
            {error && (
              <AlertCircle className="h-5 w-5 text-error-500" />
            )}

            {/* Password Toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}

            {/* Custom Right Icon */}
            {rightIcon && !isPassword && !error && !success && (
              <div className="text-neutral-400">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Hint Text */}
        {hint && !error && !success && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <Info className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-neutral-500">{hint}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <AlertCircle className="h-4 w-4 text-error-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-error-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && !error && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-success-600">{success}</p>
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

/**
 * Textarea component with similar styling
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  containerClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      success,
      hint,
      containerClassName = '',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'block w-full rounded-lg border bg-white px-4 py-2.5 text-neutral-900 placeholder-neutral-400 transition-all duration-200 focus:outline-none disabled:bg-neutral-50 disabled:cursor-not-allowed resize-y min-h-[100px]'
    
    const stateClasses = error
      ? 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
      : success
      ? 'border-success-500 focus:border-success-500 focus:ring-2 focus:ring-success-500/20'
      : 'border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'

    return (
      <div className={`w-full ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          disabled={disabled}
          className={`${baseClasses} ${stateClasses} ${className}`}
          {...props}
        />

        {/* Hint Text */}
        {hint && !error && !success && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <Info className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-neutral-500">{hint}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <AlertCircle className="h-4 w-4 text-error-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-error-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && !error && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-success-600">{success}</p>
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Input

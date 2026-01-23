import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Check, Search, AlertCircle } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  options: SelectOption[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  multiple?: boolean
  searchable?: boolean
  disabled?: boolean
  required?: boolean
  containerClassName?: string
  className?: string
}

/**
 * Polished Select component with search and multi-select support
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      placeholder = 'Select an option',
      options,
      value,
      onChange,
      multiple = false,
      searchable = false,
      disabled = false,
      required = false,
      containerClassName = '',
      className = '',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearchQuery('')
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, [isOpen, searchable])

    // Filter options based on search
    const filteredOptions = searchQuery
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options

    // Get selected options
    const selectedOptions = multiple
      ? options.filter((opt) => (value as string[])?.includes(opt.value))
      : options.find((opt) => opt.value === value)

    // Handle option selection
    const handleSelect = (optionValue: string) => {
      if (multiple) {
        const currentValues = (value as string[]) || []
        const newValues = currentValues.includes(optionValue)
          ? currentValues.filter((v) => v !== optionValue)
          : [...currentValues, optionValue]
        onChange?.(newValues)
      } else {
        onChange?.(optionValue)
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    // Remove selected option (multi-select)
    const handleRemove = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if (multiple) {
        const newValues = ((value as string[]) || []).filter((v) => v !== optionValue)
        onChange?.(newValues)
      }
    }

    // Get display text
    const getDisplayText = () => {
      if (multiple) {
        const selected = selectedOptions as SelectOption[]
        return selected.length > 0
          ? `${selected.length} selected`
          : placeholder
      }
      return (selectedOptions as SelectOption)?.label || placeholder
    }

    const baseClasses = 'relative w-full rounded-lg border bg-white px-4 py-2.5 text-left transition-all duration-200 focus:outline-none disabled:bg-neutral-50 disabled:cursor-not-allowed cursor-pointer'
    
    const stateClasses = error
      ? 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
      : isOpen
      ? 'border-primary-500 ring-2 ring-primary-500/20'
      : 'border-neutral-300 hover:border-neutral-400'

    return (
      <div ref={ref} className={`w-full ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Select Container */}
        <div ref={dropdownRef} className="relative">
          {/* Select Button */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`${baseClasses} ${stateClasses} ${className}`}
          >
            <div className="flex items-center justify-between gap-2">
              {/* Selected Values (Multi-select) */}
              {multiple && (selectedOptions as SelectOption[]).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(selectedOptions as SelectOption[]).map((option) => (
                    <span
                      key={option.value}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-800 rounded-md text-sm"
                    >
                      {option.label}
                      <button
                        type="button"
                        onClick={(e) => handleRemove(option.value, e)}
                        className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className={value ? 'text-neutral-900' : 'text-neutral-400'}>
                  {getDisplayText()}
                </span>
              )}

              {/* Chevron */}
              <ChevronDown
                className={`h-5 w-5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
              {/* Search Input */}
              {searchable && (
                <div className="p-2 border-b border-neutral-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="overflow-y-auto max-h-48">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => {
                    const isSelected = multiple
                      ? (value as string[])?.includes(option.value)
                      : value === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => !option.disabled && handleSelect(option.value)}
                        disabled={option.disabled}
                        className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-primary-50 text-primary-900'
                            : 'hover:bg-neutral-50 text-neutral-900'
                        } ${
                          option.disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        <span className="text-sm">{option.label}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-neutral-500">
                    No options found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hint Text */}
        {hint && !error && (
          <p className="text-sm text-neutral-500 mt-1.5">{hint}</p>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <AlertCircle className="h-4 w-4 text-error-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-error-600">{error}</p>
          </div>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select

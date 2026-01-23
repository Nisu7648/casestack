import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, MoreHorizontal } from 'lucide-react'

export interface DropdownItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  divider?: boolean
}

export interface DropdownProps {
  items: DropdownItem[]
  trigger?: React.ReactNode
  position?: 'left' | 'right'
  icon?: 'vertical' | 'horizontal'
  className?: string
}

/**
 * Dropdown menu component with animations
 */
export const Dropdown: React.FC<DropdownProps> = ({
  items,
  trigger,
  position = 'right',
  icon = 'vertical',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick()
      setIsOpen(false)
    }
  }

  const defaultTrigger = (
    <button
      type="button"
      className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500"
      aria-label="Open menu"
    >
      {icon === 'vertical' ? (
        <MoreVertical className="h-5 w-5" />
      ) : (
        <MoreHorizontal className="h-5 w-5" />
      )}
    </button>
  )

  const positionClasses = position === 'left' ? 'right-0' : 'left-0'

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || defaultTrigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${positionClasses} mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-[1060] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200`}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.divider && index > 0 && (
                  <div className="my-1 border-t border-neutral-200" />
                )}
                
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                    item.variant === 'danger'
                      ? 'text-error-600 hover:bg-error-50'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  } ${
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  {item.icon && (
                    <span className="flex-shrink-0">{item.icon}</span>
                  )}
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dropdown

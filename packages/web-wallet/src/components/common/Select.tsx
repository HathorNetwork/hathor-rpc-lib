import { SelectHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import Icon from './Icon'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-text-primary">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={clsx(
              'w-full bg-background border rounded-lg px-4 py-3 text-white',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-colors duration-200 appearance-none cursor-pointer',
              {
                'border-card-border': !error,
                'border-error': error,
              },
              className
            )}
            {...props}
          >
            {children}
          </select>
          <Icon 
            icon={ChevronDown} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" 
          />
        </div>
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
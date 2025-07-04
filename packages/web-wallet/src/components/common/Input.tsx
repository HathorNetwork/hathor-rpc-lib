import { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'
import { AlertCircle } from 'lucide-react'
import Icon from './Icon'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  suffix?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-text-primary">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={clsx(
              'w-full bg-background border rounded-lg px-4 py-3 text-white placeholder-text-muted',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-colors duration-200',
              {
                'border-card-border': !error,
                'border-error': error,
                'pr-16': suffix,
              },
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="text-sm text-error flex items-center space-x-1">
            <Icon icon={AlertCircle} size="sm" />
            <span>{error}</span>
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
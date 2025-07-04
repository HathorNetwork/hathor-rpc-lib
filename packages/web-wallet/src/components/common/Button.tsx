import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'disabled'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-medium rounded-2xl transition-all duration-200 flex items-center justify-center',
        {
          'bg-gradient-primary text-white hover:opacity-90': variant === 'primary' && !disabled,
          'bg-card border border-card-border text-white hover:bg-card-border': variant === 'secondary' && !disabled,
          'text-text-secondary hover:text-white': variant === 'ghost' && !disabled,
          'bg-gray-700/50 text-gray-500 cursor-not-allowed': variant === 'disabled' || disabled,
          'px-6 py-2 text-sm': size === 'sm',
          'px-8 py-3.5 text-base': size === 'md',
          'px-10 py-4 text-base': size === 'lg',
        },
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
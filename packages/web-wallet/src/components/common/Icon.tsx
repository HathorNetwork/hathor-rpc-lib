import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

export interface IconProps {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-12 h-12'
}

export default function Icon({ icon: LucideIconComponent, size = 'md', className }: IconProps) {
  return (
    <LucideIconComponent
      className={clsx(sizeClasses[size], className)}
      strokeWidth={2.5}
    />
  )
}
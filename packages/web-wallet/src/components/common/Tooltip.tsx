import { ReactNode, useState } from 'react'
import clsx from 'clsx'

interface TooltipProps {
  children: ReactNode
  content: string
  className?: string
}

export default function Tooltip({ children, content, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={clsx(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2',
            'bg-white text-gray-800 text-sm font-medium rounded-lg shadow-lg',
            'whitespace-nowrap z-50',
            'after:content-[""] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2',
            'after:border-4 after:border-transparent after:border-t-white',
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
import { ReactNode, useEffect } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import Icon from './Icon'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export default function Modal({ isOpen, onClose, children, className }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative bg-[#1E1E2A] border border-card-border rounded-3xl shadow-2xl',
          'max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-text-secondary hover:text-white transition-colors"
        >
          <Icon icon={X} size="lg" />
        </button>
        {children}
      </div>
    </div>
  )
}
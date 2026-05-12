import { useState } from 'react'

interface ConfirmationOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  icon?: 'delete' | 'logout' | 'remove' | 'warning' | 'info'
}

export const useConfirmationDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmationOptions | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const confirm = (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(options)
      setIsOpen(true)
      setResolvePromise(() => resolve)
    })
  }

  const handleConfirm = () => {
    setIsOpen(false)
    setOptions(null)
    if (resolvePromise) {
      resolvePromise(true)
    }
    setResolvePromise(null)
  }

  const handleCancel = () => {
    setIsOpen(false)
    setOptions(null)
    if (resolvePromise) {
      resolvePromise(false)
    }
    setResolvePromise(null)
  }

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel
  }
}

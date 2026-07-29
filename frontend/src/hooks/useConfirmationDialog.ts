import { useState } from 'react'

interface ConfirmationOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  icon?: 'delete' | 'logout' | 'remove' | 'warning' | 'info'
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
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

  const handleConfirm = async () => {
    try {
      if (options?.onConfirm) await options.onConfirm()
    } finally {
      setIsOpen(false)
      const resolve = resolvePromise
      setOptions(null)
      setResolvePromise(null)
      if (resolve) resolve(true)
    }
  }

  const handleCancel = () => {
    try {
      if (options?.onCancel) options.onCancel()
    } finally {
      setIsOpen(false)
      const resolve = resolvePromise
      setOptions(null)
      setResolvePromise(null)
      if (resolve) resolve(false)
    }
  }

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel
  }
}

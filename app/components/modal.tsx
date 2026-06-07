// components/modal.tsx
'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'

interface ModalProps {
  title: string
  children: React.ReactNode
}

export interface ModalHandle {
  open: () => void
  close: () => void
}

const Modal = forwardRef<ModalHandle, ModalProps>(({ title, children }, ref) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.showModal(),
    close: () => dialogRef.current?.close(),
  }))

  return (
    <dialog ref={dialogRef} className="modal" onClick={(e) => {
      if (e.target === dialogRef.current) dialogRef.current?.close()
    }}>
      <div className="modal-box relative">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={() => dialogRef.current?.close()}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        {children}
      </div>
    </dialog>
  )
})

Modal.displayName = 'Modal'

export default Modal
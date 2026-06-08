import React, { ReactNode } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
};

export default function Modal({ isOpen, onClose, children, showCloseButton = true }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {showCloseButton && (
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
        {children}
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(2, 6, 23, 0.5);
          background-color: rgba(2, 6, 23, 0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #ffffff;
          color: #0f172a;
          padding: 24px;
          border-radius: 20px;
          position: relative;
          max-width: 980px;
          width: min(96vw, 980px);
          max-height: 92vh;
          overflow-y: auto;
          border: 1px solid hsl(var(--border));
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
        }
        .close-btn {
          position: absolute;
          top: 14px; right: 14px;
          background: none; border: none;
          font-size: 1.75rem; line-height: 1; cursor: pointer;
          color: hsl(var(--foreground));
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .close-btn:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

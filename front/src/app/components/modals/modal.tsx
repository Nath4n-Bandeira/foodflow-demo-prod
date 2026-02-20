import React, { ReactNode } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        {children}
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: hsl(var(--card));
          color: hsl(var(--card-foreground));
          padding: 20px;
          border-radius: 8px;
          position: relative;
          max-width: 500px;
          width: 90%;
          border: 1px solid hsl(var(--border));
        }
        .close-btn {
          position: absolute;
          top: 10px; right: 10px;
          background: none; border: none;
          font-size: 1.5rem; cursor: pointer;
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
